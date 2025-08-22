package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.api.ImmutableAction;
import com.hoatv.action.manager.api.ImmutableJob;
import com.hoatv.action.manager.api.ImmutableJobResult;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.*;
import com.hoatv.action.manager.document.transformers.JobTransformer;
import com.hoatv.action.manager.dtos.*;
import com.hoatv.fwk.common.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.fwk.common.exceptions.AppException;
import com.hoatv.fwk.common.services.CheckedSupplier;
import com.hoatv.fwk.common.services.TemplateEngineEnum;
import com.hoatv.fwk.common.ultilities.*;
import com.hoatv.metric.mgmt.entities.ComplexValue;
import com.hoatv.metric.mgmt.entities.MetricTag;
import com.hoatv.metric.mgmt.services.MetricService;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import com.hoatv.task.mgmt.entities.TaskEntry;
import com.hoatv.task.mgmt.services.ScheduleTaskMgmtService;
import com.hoatv.task.mgmt.services.TaskFactory;
import com.hoatv.task.mgmt.services.TaskMgmtServiceV1;
import jakarta.annotation.PostConstruct;
import lombok.SneakyThrows;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.util.Predicates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.AbstractMap.SimpleEntry;
import java.util.concurrent.*;
import java.util.function.BiConsumer;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.hoatv.action.manager.document.transformers.JobTransformer.updateFromJobDefinitionDTO;
import static com.hoatv.action.manager.utils.JobManagerConstants.*;

@Service
public class JobManagerServiceImpl implements JobManagerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(JobManagerServiceImpl.class);

    public static final int NUMBER_OF_JOB_THREADS = 20;

    public static final int MAX_AWAIT_TERMINATION_MILLIS = 5000;

    public static final String ACTION_MANAGER = "action-manager";

    private static final String TEMPLATE_ENGINE_NAME = "templateEngineName";

    public static final int NUMBER_OF_SCHEDULE_THREADS = 100;

    private final ScriptEngineService scriptEngineService;

    private final ObjectMapper objectMapper;

    private final JobDocumentRepository jobDocumentRepository;

    private final JobExecutionResultDocumentRepository jobResultDocumentRepository;

    private final MetricService metricService;

    private final JobManagerStatistics jobManagerStatistics;

    private final TaskMgmtServiceV1 ioTaskMgmtService;

    private final TaskMgmtServiceV1 cpuTaskMgmtService;

    private final ScheduleTaskMgmtService scheduleTaskMgmtService;

    private final Map<String, ScheduledFuture<?>> scheduledJobRegistry = new ConcurrentHashMap<>();

    private final GenericKeyedLock<String> jobExecutionLock = new GenericKeyedLock<>();

    @Autowired
    public JobManagerServiceImpl(ScriptEngineService scriptEngineService,
                                 JobDocumentRepository jobDocumentRepository,
                                 JobManagerStatistics jobManagerStatistics,
                                 JobExecutionResultDocumentRepository jobResultDocumentRepository) {
        this.scriptEngineService = scriptEngineService;
        this.jobDocumentRepository = jobDocumentRepository;
        this.jobResultDocumentRepository = jobResultDocumentRepository;
        this.jobManagerStatistics = jobManagerStatistics;
        this.metricService = new MetricService();
        this.ioTaskMgmtService = TaskFactory.INSTANCE.getTaskMgmtServiceV1(
                NUMBER_OF_JOB_THREADS,
                MAX_AWAIT_TERMINATION_MILLIS,
                IO_JOB_MANAGER_APPLICATION
        );
        int cores = Runtime.getRuntime().availableProcessors();
        this.cpuTaskMgmtService = TaskFactory.INSTANCE.getTaskMgmtServiceV1(
                cores,
                MAX_AWAIT_TERMINATION_MILLIS,
                CPU_JOB_MANAGER_APPLICATION
        );
        this.scheduleTaskMgmtService = TaskFactory.INSTANCE.newScheduleTaskMgmtService(
                ACTION_MANAGER,
                NUMBER_OF_SCHEDULE_THREADS,
                MAX_AWAIT_TERMINATION_MILLIS
        );
        this.objectMapper = new ObjectMapper();
        this.jobManagerStatistics.setMetricService(metricService);
        this.jobManagerStatistics.setIoTaskMgmtService(ioTaskMgmtService);
        this.jobManagerStatistics.setCpuTaskMgmtService(cpuTaskMgmtService);
        this.jobManagerStatistics.setScheduleTaskMgmtService(scheduleTaskMgmtService);
    }

    @PostConstruct
    public void init() {
        Example<JobDocument> jobEx = Example.of(JobDocument.builder().isScheduled(false).build());
        long numberOfJobs = jobDocumentRepository.count(jobEx);
        jobManagerStatistics.setTotalNumberOfJobs(numberOfJobs);

        JobResultDocument exampleJobDocument = JobResultDocument.builder()
                .jobExecutionStatus(JobExecutionStatus.FAILURE)
                .build();
        Example<JobResultDocument> failureJobEx = Example.of(exampleJobDocument);
        this.jobManagerStatistics.setNumberOfFailureJobs(jobResultDocumentRepository.count(failureJobEx));
    }


    @Override
    @LoggingMonitor(description = "Get enabled schedule jobs from active actions: {argument0}")
    public Map<String, Map<String, String>> getEnabledScheduleJobsGroupByActionId(Set<String> actionIds) {
        List<JobDocument> scheduledJobDocuments = jobDocumentRepository.
                findByIsScheduledTrueAndJobStatusAndActionIdIn(JobStatus.ACTIVE, actionIds);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(scheduledJobDocuments);

        List<Triplet<String, String, String>> jobDocumentMapping =
                getJobDocumentPairs(scheduledJobDocuments, jobResultDocuments, Predicates.isTrue());

        Map<String, List<Triplet<String, String, String>>> scheduleJobMapping = jobDocumentMapping.stream()
                .collect(Collectors.groupingBy(Triplet::getFirst));

        return scheduleJobMapping.entrySet().stream().map(p -> {
            Map<String, String> jobJobResultMapping =
                    p.getValue().stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
            return new AbstractMap.SimpleEntry<>(p.getKey(), jobJobResultMapping);
        }).collect(Collectors.toMap(SimpleEntry::getKey, SimpleEntry::getValue));
    }

    @Override
    @LoggingMonitor(description = "Get job summary with page info: {argument1}")
    public Page<JobOverviewDTO> getOverviewJobs(PageRequest pageRequest) {
        Page<JobDocument> jobDocuments = jobDocumentRepository.findAll(pageRequest);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return JobTransformer.getJobOverviewDTOs(jobDocuments, jobResultDocuments);
    }

    @Override
    @LoggingMonitor(description = "Get jobs from action hash: {argument0}, page info: {argument1}")
    public Page<JobOverviewDTO> getJobsFromAction(String actionId, PageRequest pageRequest) {
        Page<JobDocument> jobDocuments = jobDocumentRepository.findJobByActionId(actionId, pageRequest);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return JobTransformer.getJobOverviewDTOs(jobDocuments, jobResultDocuments);
    }

    @Override
    @LoggingMonitor(description = "Get jobs from action hash {argument0}")
    public Map<String, String> getJobsFromAction(String actionId, Predicate<JobResultDocument> filter) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findJobByActionId(actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments, filter)
                .stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
    }

    @Override
    @LoggingMonitor(description = "Get one time jobs from action hash {argument0}")
    public Map<String, String> getEnabledOnetimeJobs(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findByIsScheduledFalseAndJobStatusAndActionId(JobStatus.ACTIVE, actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments, Predicates.isTrue())
                .stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
    }

    @Override
    @LoggingMonitor(description = "Get enabled scheduled jobs from action hash {argument0}")
    public Map<String, String> getEnabledScheduledJobs(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findByIsScheduledTrueAndJobStatusAndActionId(JobStatus.ACTIVE, actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments, Predicates.isTrue())
                .stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Pause job by hash: {argument0}")
    public void pause(String jobHash) {
        JobDocument jobDocument = getJobDocument(jobHash);
        String jobName = jobDocument.getJobName();
        if (!VALID_JOB_STATUS_TO_RUN.contains(jobDocument.getJobStatus())) {
            LOGGER.warn("Unable to pause {} job because status is: {}, only accept: {}", jobName,
                    jobDocument.getJobStatus(), VALID_JOB_STATUS_TO_RUN);
            return;
        }

        jobDocument.setJobStatus(JobStatus.PAUSED);
        if (jobDocument.isScheduled()) {
            scheduledJobRegistry.entrySet().stream()
                    .filter(p -> jobHash.equals(p.getKey()))
                    .filter(p -> Objects.nonNull(p.getValue()))
                    .peek(p -> LOGGER.info("Delete the schedule tasks - {} on {} job", p.getKey(), jobName))
                    .map(Map.Entry::getValue)
                    .forEach(scheduleTaskMgmtService::cancel);
            metricService.removeMetric(jobHash);
        }
        jobDocumentRepository.save(jobDocument);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Delete job from hash: {argument0}")
    public void delete(String jobId) {
        Optional<JobDocument> jobDocumentOptional = jobDocumentRepository.findById(jobId);
        JobDocument jobDocument = jobDocumentOptional.orElseThrow(() -> new EntityNotFoundException("Cannot find job: " + jobId));

        String jobName = jobDocument.getJobName();
        if (jobDocument.isScheduled() && jobDocument.getJobStatus() == JobStatus.ACTIVE) {
            LOGGER.info("Delete the schedule tasks for {} job", jobName);
            ScheduledFuture<?> scheduledFuture = scheduledJobRegistry.get(jobId);
            scheduleTaskMgmtService.cancel(scheduledFuture);
            LOGGER.info("Delete the metric tasks for {} job", jobName);
            metricService.removeMetric(jobId);
        }
        jobDocumentRepository.delete(jobDocument);
        JobResultDocument jobResultDocument = jobResultDocumentRepository.findByJobId(jobId);
        jobResultDocumentRepository.delete(jobResultDocument);
        LOGGER.info("Deleted the job results for {} job ", jobName);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Delete job by action: {argument0}")
    public void deleteJobsByActionId(String actionId) {
        LOGGER.info("Deleted the job result documents belong to action {}", actionId);
        List<JobDocument> jobIds = jobDocumentRepository.findByIsScheduledTrueAndJobStatusAndActionId(JobStatus.ACTIVE, actionId);
        List<String> jobIdStrings = jobIds.stream().map(JobDocument::getHash).toList();

        scheduledJobRegistry.entrySet().stream()
                .filter(p -> jobIdStrings.contains(p.getKey()))
                .filter(p -> Objects.nonNull(p.getValue()))
                .peek(p -> LOGGER.info("Delete the schedule tasks - {}", p.getKey()))
                .map(Map.Entry::getValue)
                .forEach(scheduleTaskMgmtService::cancel);
        jobIdStrings.forEach(metricService::removeMetric);
        jobDocumentRepository.deleteByActionId(actionId);
        LOGGER.info("Deleted the job documents belong to action {}", actionId);
        jobResultDocumentRepository.deleteByActionId(actionId);
    }

    @Override
    @LoggingMonitor
    public void processBulkJobs(List<ActionExecutionContext> actionExecutionContexts) {
        actionExecutionContexts.forEach(this::processBulkJobs);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Process bulk jobs {argument0.getJobDocumentPairs()}")
    public void processBulkJobs(ActionExecutionContext actionExecutionContext) {
        boolean isRelayAction = actionExecutionContext.isRelayAction();
        Map<String, String> jobDocumentInAction = actionExecutionContext.getJobDocumentPairs();
        jobDocumentInAction.forEach((jobHash, jobResultHash) -> {
            Optional<JobDocument> jobDocumentOptional = jobDocumentRepository.findById(jobHash);
            ObjectUtils.checkThenThrow(jobDocumentOptional.isEmpty(), "Cannot find job with hash" + jobHash);
            JobDocument jobDocument = jobDocumentOptional.get();
            Optional<JobResultDocument> jobResultDocumentOp = jobResultDocumentRepository.findById(jobResultHash);
            ObjectUtils.checkThenThrow(jobResultDocumentOp.isEmpty(), "Cannot find job result with hash" + jobResultHash);
            JobResultDocument jobResultDocument = jobResultDocumentOp.get();
            ImmutableAction immutableAction = actionExecutionContext.getActionDocument();
            processJob(jobDocument, jobResultDocument, immutableAction, actionExecutionContext.getOnCompletedJobCallback(), isRelayAction);
        });
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Process job: {argument0.getJobName()}")
    public void processJob(ImmutableJob immutableJob,
                           JobResultDocument jobResultDocument,
                           ImmutableAction immutableAction,
                           BiConsumer<JobExecutionStatus, JobExecutionStatus> callback, boolean isRelayAction) {
        jobManagerStatistics.increaseNumberOfJobs();
        if (immutableJob.isScheduled() && !isRelayAction) {
            ScheduledFuture<?> scheduledFuture = processScheduleJob(immutableJob, jobResultDocument, immutableAction, callback);
            scheduledJobRegistry.put(immutableJob.getHash(), scheduledFuture);
            return;
        }
        if (immutableJob.isAsync() || isRelayAction) {
            processAsync(immutableJob, jobResultDocument, immutableAction, callback);
            return;
        }
        processPersistenceJob(immutableJob, jobResultDocument, immutableAction, callback);
    }

    @Override
    @LoggingMonitor(description = "Get job detail from hash: {argument0}")
    public JobDetailDTO getJobDetails(String hash) {
        JobDocument jobDocument = getJobDocument(hash);
        return JobTransformer.jobDetailDTO(jobDocument);
    }

    @Override
    public List<JobDocumentRepository.JobIdImmutable> getJobIdsByAction(String actionId) {
        return jobDocumentRepository.findJobsByActionId(actionId);
    }

    @Override
    @LoggingMonitor(description = "Get job document from hash: {argument0}")
    public JobDocument getJobDocument(String hash) {
        Optional<JobDocument> jobDocumentOptional = jobDocumentRepository.findById(hash);
        return jobDocumentOptional.orElseThrow(() -> new EntityNotFoundException("Cannot find job ID: " + hash));
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Initial job: {argument0.getJobName()} from job definition")
    public Pair<String, String> initialJobs(JobDefinitionDTO jobDefinitionDTO, String actionId) {
        JobDocument entity = JobTransformer.fromJobDefinition(jobDefinitionDTO, actionId);
        JobDocument jobDocument = jobDocumentRepository.save(entity);
        JobResultDocument.JobResultDocumentBuilder jobResultDocumentBuilder = JobResultDocument.builder()
                .jobState(JobState.INITIAL)
                .jobExecutionStatus(JobExecutionStatus.PENDING)
                .actionId(actionId)
                .createdAt(DateTimeUtils.getCurrentEpochTimeInSecond())
                .jobId(jobDocument.getHash());
        JobResultDocument jobResultDocument = jobResultDocumentRepository.save(jobResultDocumentBuilder.build());
        return Pair.of(jobDocument.getHash(), jobResultDocument.getHash());
    }

    @Override
    @LoggingMonitor(description = "Dry run job: {argument0.getJobName()}")
    public void processNonePersistenceJob(ImmutableJob immutableJob, ImmutableAction immutableAction) {
        String jobName = immutableJob.getJobName();
        try {
            ImmutableJobResult jobResultImmutable = process(immutableJob, immutableAction);
            LOGGER.info("Job result: {}", jobResultImmutable);
        } catch (Exception exception) {
            LOGGER.error("An exception occurred while processing {} job", jobName, exception);
        }
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Update job: {argument1.getJobName()}")
    public void update(String hash, JobDefinitionDTO jobDefinitionDTO) {
        JobDocument persistenceJobDocument = getJobDocument(hash);
        updateFromJobDefinitionDTO(persistenceJobDocument, jobDefinitionDTO);
        jobDocumentRepository.save(persistenceJobDocument);
    }


    private List<JobResultDocument> getJobResultDocuments(Page<JobDocument> jobDocuments) {
        List<String> jobIds = jobDocuments.stream().map(JobDocument::getHash).toList();
        return jobResultDocumentRepository.findByJobIdIn(jobIds);
    }

    private List<JobResultDocument> getJobResultDocuments(List<JobDocument> jobDocuments) {
        List<String> jobIds = jobDocuments.stream().map(JobDocument::getHash).toList();
        return jobResultDocumentRepository.findByJobIdIn(jobIds);
    }

    private List<Triplet<String, String, String>> getJobDocumentPairs(List<JobDocument> jobDocuments,
                                                                      List<JobResultDocument> jobResultDocuments,
                                                                      Predicate<JobResultDocument> filter) {
        Map<String, JobResultDocument> jobResultMapping = jobResultDocuments.stream()
                .map(p -> new SimpleEntry<>(p.getJobId(), p))
                .collect(Collectors.toMap(SimpleEntry::getKey, SimpleEntry::getValue));

        return jobDocuments.stream()
                .filter(jobDocument -> {
                    String jobDocumentHash = jobDocument.getHash();
                    return filter.test(jobResultMapping.get(jobDocumentHash));
                })
                .map(jobDocument -> {
                    String jobDocumentHash = jobDocument.getHash();
                    JobResultDocument jobResultDocument = jobResultMapping.get(jobDocumentHash);
                    return Triplet.of(jobDocument.getActionId(), jobDocumentHash, jobResultDocument.getHash());
                })
                .toList();
    }

    private ImmutableJobResult process(ImmutableJob immutableJob, ImmutableAction immutableAction) {

        try {
            @SuppressWarnings("unchecked")
            CheckedSupplier<Map<String, Object>> jobConfigurationSupplier =
                    () -> objectMapper.readValue(immutableJob.getConfigurations(), Map.class);
            @SuppressWarnings("unchecked")
            CheckedSupplier<Map<String, Object>> actionConfigurationSupplier =
                    () -> objectMapper.readValue(immutableAction.getConfigurations(), Map.class);
            HashMap<String, Object> configurationMap = new HashMap<>();
            configurationMap.put(TEMPLATE_ENGINE_NAME, "freemarker");
            configurationMap.putAll(actionConfigurationSupplier.get());
            configurationMap.putAll(jobConfigurationSupplier.get());

            String jobName = immutableJob.getJobName();
            String templateName = String.format("%s-%s", jobName, immutableJob.getJobCategory());
            String templateEngineName = (String) configurationMap.get(TEMPLATE_ENGINE_NAME);
            TemplateEngineEnum templateEngine = TemplateEngineEnum.getTemplateEngineFromName(templateEngineName);
            String jobContent = templateEngine.process(templateName, immutableJob.getJobContent(), configurationMap);

            Map<String, Object> jobExecutionContext = new HashMap<>(configurationMap);
            jobExecutionContext.put("templateEngine", templateEngine);

            MDC.put("jobName", jobName);
            LOGGER.info("Run job {} with configurations: {}", jobName, configurationMap);
            return scriptEngineService.execute(jobContent, jobExecutionContext);
        } finally {
            MDC.clear();
        }
    }

    @SneakyThrows
    private void processPersistenceJob(ImmutableJob immutableJob,
                                       JobResultDocument jobResultDocument,
                                       ImmutableAction immutableAction,
                                       BiConsumer<JobExecutionStatus, JobExecutionStatus> onJobStatusChange) {
        String jobName = immutableJob.getJobName();
        jobExecutionLock.putIfAbsent(jobName, new Semaphore(1));
        if (jobExecutionLock.tryAcquire(jobName, 5000, TimeUnit.MILLISECONDS)) {
            try {
                JobStatus jobStatus = immutableJob.getJobStatus();
                if (!VALID_JOB_STATUS_TO_RUN.contains(jobStatus)) {
                    String messageTemplate = "Job status {} for {} is not supported to process, only support {}";
                    LOGGER.error(messageTemplate, jobStatus, jobName, VALID_JOB_STATUS_TO_RUN);
                    return;
                }

                jobManagerStatistics.increaseNumberOfProcessingJobs();
                long currentEpochTimeInMillisecond = DateTimeUtils.getCurrentEpochTimeInMillisecond();
                JobExecutionStatus prevJobStatus = jobResultDocument.getJobExecutionStatus();
                JobExecutionStatus nextJobStatus = JobExecutionStatus.FAILURE;
                String jobException = null;

                try {
                    if (jobResultDocument.getStartedAt() == 0) {
                        jobResultDocument.setStartedAt(currentEpochTimeInMillisecond);
                    }
                    jobResultDocument.setUpdatedAt(currentEpochTimeInMillisecond);
                    jobResultDocument.setJobExecutionStatus(JobExecutionStatus.PROCESSING);
                    jobResultDocumentRepository.save(jobResultDocument);

                    ImmutableJobResult jobResult = process(immutableJob, immutableAction);
                    processOutputTargets(immutableJob, jobName, jobResult);

                    nextJobStatus = StringUtils.isNotEmpty(jobResult.getException()) ?
                            JobExecutionStatus.FAILURE : JobExecutionStatus.SUCCESS;
                    jobException = jobResult.getException();

                } catch (Exception exception) {
                    LOGGER.error("An exception occurred while processing {} job", jobName, exception);
                    jobException = exception.getMessage();
                } finally {
                    updateJobResultDocument(jobResultDocument, nextJobStatus, currentEpochTimeInMillisecond, jobException);
                    processJobResultCallback(onJobStatusChange, prevJobStatus, nextJobStatus);
                }
            } finally {
                jobExecutionLock.release(jobName);
            }
        } else {
            LOGGER.info("Skip process job {} because it is running...", jobName);
        }
    }

    private ScheduledFuture<?> processScheduleJob(ImmutableJob jobDocument,
                                                  JobResultDocument jobResultDocument,
                                                  ImmutableAction immutableAction,
                                                  BiConsumer<JobExecutionStatus, JobExecutionStatus> callback) {
        String jobName = jobDocument.getJobName();
        TimeUnit timeUnit = TimeUnit.valueOf(jobDocument.getScheduleUnit());
        Callable<Void> jobProcessRunnable = () -> {
            // Make sure the job data is up-to-date for each running time
            Optional<JobDocument> jobDocument1 = jobDocumentRepository.findById(jobDocument.getHash());
            ImmutableJob immutableJob = jobDocument1.map(ImmutableJob.class::cast).orElse(jobDocument);
            processPersistenceJob(immutableJob, jobResultDocument, immutableAction, callback);
            return null;
        };

        long scheduleIntervalInMs = timeUnit.toMillis(jobDocument.getScheduleInterval());
        TaskEntry taskEntry = new TaskEntry(jobName, ACTION_MANAGER, jobProcessRunnable, 0, scheduleIntervalInMs);
        ScheduledFuture<?> scheduledFuture = scheduleTaskMgmtService.scheduleFixedRateTask(taskEntry, 1000, TimeUnit.MILLISECONDS);
        if (Objects.isNull(scheduledFuture)) {
            LOGGER.error("Reached to maximum number of schedule thread, no more thread to process {}", jobName);
            return null;
        }
        return scheduledFuture;
    }

    private void processAsync(ImmutableJob immutableJob,
                              JobResultDocument jobResultDocument,
                              ImmutableAction immutableAction,
                              BiConsumer<JobExecutionStatus, JobExecutionStatus> callback) {
        Runnable jobProcessRunnable = () -> processPersistenceJob(immutableJob, jobResultDocument, immutableAction, callback);
        if (immutableJob.getJobCategory() == JobCategory.CPU) {
            LOGGER.info("Using CPU threads to execute {} job", immutableJob.getJobName());
            cpuTaskMgmtService.execute(jobProcessRunnable);
            return;
        }
        LOGGER.info("Using IO threads to execute {} job", immutableJob.getJobName());
        ioTaskMgmtService.execute(jobProcessRunnable);
    }

    private void processJobResultCallback(BiConsumer<JobExecutionStatus, JobExecutionStatus> onJobStatusChange,
                                          JobExecutionStatus prevJobStatus,
                                          JobExecutionStatus nextJobStatus) {

        onJobStatusChange.accept(prevJobStatus, nextJobStatus);
        if (nextJobStatus == JobExecutionStatus.FAILURE) {
            jobManagerStatistics.increaseNumberOfFailureJobs();
        }
        jobManagerStatistics.decreaseNumberOfProcessingJobs();
    }

    private void updateJobResultDocument(JobResultDocument jobResultDocument,
                                         JobExecutionStatus nextJobStatus,
                                         long startedAt, String jobResult) {
        long endedAt = DateTimeUtils.getCurrentEpochTimeInMillisecond();
        jobResultDocument.setJobState(JobState.COMPLETED);
        jobResultDocument.setJobExecutionStatus(nextJobStatus);
        jobResultDocument.setEndedAt(endedAt);
        jobResultDocument.setElapsedTime(endedAt - startedAt);
        jobResultDocument.setFailureNotes(jobResult);
        jobResultDocumentRepository.save(jobResultDocument);
    }

    private void processOutputTargets(ImmutableJob immutableJob, String jobName, ImmutableJobResult jobResult) {
        List<String> jobOutputTargets = immutableJob.getOutputTargets();
        jobOutputTargets.forEach(target -> {
            JobOutputTarget jobOutputTarget = JobOutputTarget.valueOf(target);
            switch (jobOutputTarget) {
                case CONSOLE -> LOGGER.info("Async job: {} result: {}", jobName, jobResult);
                case METRIC -> processOutputData(jobResult, jobName);
                default -> throw new AppException("Unsupported output target " + target);
            }
        });
    }

    private void processOutputData(ImmutableJobResult jobResult, String jobName) {
        String metricNamePrefix = JOB_MANAGER_METRIC_NAME_PREFIX + "-for-" + jobName;
        if (jobResult instanceof JobResult singleJobResult) {
            ArrayList<MetricTag> metricTags = new ArrayList<>();
            MetricTag metricTag = new MetricTag(String.valueOf(singleJobResult.getData()));
            metricTag.setAttributes(Map.of("name", metricNamePrefix));
            metricTags.add(metricTag);
            metricService.setMetric(metricNamePrefix, metricTags);
            return;
        }

        if (jobResult instanceof JobResultDict jobResultDict) {
            Map<String, String> multipleJobResultMap = jobResultDict.getData();
            LOGGER.info("Reset all metric values for related {} job {} back to 0", jobName, metricNamePrefix);
            List<ComplexValue> regexMetrics = metricService.getRegexMetrics(metricNamePrefix + ".*");
            regexMetrics.stream().flatMap(p -> p.getTags().stream())
                    .peek(p -> LOGGER.info("Reset metric {} value to 0", p.getAttributes().get("name")))
                    .forEach(p -> p.setValue("0"));

            multipleJobResultMap.forEach((name, value) -> {
                ArrayList<MetricTag> metricTags = new ArrayList<>();
                MetricTag metricTag = new MetricTag(value);
                String metricName = metricNamePrefix + "-" + name;
                metricTag.setAttributes(Map.of("name", metricName));
                metricTags.add(metricTag);
                metricService.setMetric(metricName, metricTags);
            });
        }
    }
}
