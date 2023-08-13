package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.api.JobImmutable;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.api.JobResultImmutable;
import com.hoatv.action.manager.collections.*;
import com.hoatv.action.manager.document.transformers.JobTransformer;
import com.hoatv.action.manager.dtos.*;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.fwk.common.exceptions.AppException;
import com.hoatv.fwk.common.exceptions.InvalidArgumentException;
import com.hoatv.fwk.common.services.CheckedSupplier;
import com.hoatv.fwk.common.services.TemplateEngineEnum;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import com.hoatv.fwk.common.ultilities.ObjectUtils;
import com.hoatv.fwk.common.ultilities.Pair;
import com.hoatv.fwk.common.ultilities.Triplet;
import com.hoatv.metric.mgmt.annotations.Metric;
import com.hoatv.metric.mgmt.annotations.MetricProvider;
import com.hoatv.metric.mgmt.entities.ComplexValue;
import com.hoatv.metric.mgmt.entities.MetricTag;
import com.hoatv.metric.mgmt.services.MetricService;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import com.hoatv.task.mgmt.entities.TaskEntry;
import com.hoatv.task.mgmt.services.ScheduleTaskMgmtService;
import com.hoatv.task.mgmt.services.TaskFactory;
import com.hoatv.task.mgmt.services.TaskMgmtServiceV1;
import jakarta.annotation.PostConstruct;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DurationFormatUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.AbstractMap.SimpleEntry;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import static com.hoatv.fwk.common.ultilities.ObjectUtils.checkThenThrow;

@Service
@MetricProvider(application = JobManagerServiceImpl.ACTION_MANAGER, category = MetricProviders.MetricCategories.STATS_DATA_CATEGORY)
public class JobManagerServiceImpl implements JobManagerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(JobManagerServiceImpl.class);

    public static final int NUMBER_OF_JOB_THREADS = 20;

    private static final String JOB_MANAGER_METRIC_NAME_PREFIX = "job-manager";

    public static final String IO_JOB_MANAGER_APPLICATION = "io-" + JOB_MANAGER_METRIC_NAME_PREFIX;

    public static final String CPU_JOB_MANAGER_APPLICATION = "cpu-" + JOB_MANAGER_METRIC_NAME_PREFIX;

    public static final int MAX_AWAIT_TERMINATION_MILLIS = 5000;

    public static final String ACTION_MANAGER = "action-manager";

    private static final Map<String, String> DEFAULT_CONFIGURATIONS = new HashMap<>();

    private static final String TEMPLATE_ENGINE_NAME = "templateEngineName";

    private final ScriptEngineService scriptEngineService;

    private final ObjectMapper objectMapper;

    private final JobDocumentRepository jobDocumentRepository;

    private final JobExecutionResultDocumentRepository jobResultDocumentRepository;

    private final TaskMgmtServiceV1 ioTaskMgmtService;

    private final TaskMgmtServiceV1 cpuTaskMgmtService;

    private final ScheduleTaskMgmtService scheduleTaskMgmtService;

    private final MetricService metricService;

    private final JobManagementStatistics jobManagementStatistics;

    private final Map<String, ScheduledFuture<?>> scheduledJobRegistry = new ConcurrentHashMap<>();


    static {
        DEFAULT_CONFIGURATIONS.put(TEMPLATE_ENGINE_NAME, "freemarker");
    }

    @Autowired
    public JobManagerServiceImpl(ScriptEngineService scriptEngineService, JobDocumentRepository jobDocumentRepository,
                                 JobExecutionResultDocumentRepository jobResultDocumentRepository) {
        this.scriptEngineService = scriptEngineService;
        this.jobDocumentRepository = jobDocumentRepository;
        this.jobResultDocumentRepository = jobResultDocumentRepository;
        this.metricService = new MetricService();
        this.jobManagementStatistics = new JobManagementStatistics();
        this.ioTaskMgmtService = TaskFactory.INSTANCE
                .getTaskMgmtServiceV1(NUMBER_OF_JOB_THREADS, MAX_AWAIT_TERMINATION_MILLIS, IO_JOB_MANAGER_APPLICATION);
        int cores = Runtime.getRuntime().availableProcessors();
        this.cpuTaskMgmtService = TaskFactory.INSTANCE
                .getTaskMgmtServiceV1(cores, MAX_AWAIT_TERMINATION_MILLIS, CPU_JOB_MANAGER_APPLICATION);
        this.scheduleTaskMgmtService = TaskFactory.INSTANCE
                .newScheduleTaskMgmtService(ACTION_MANAGER, 100, 5000);
        this.objectMapper = new ObjectMapper();
    }

    private static class JobManagementStatistics {
        private final AtomicLong totalNumberOfJobs = new AtomicLong(0);

        private final AtomicLong numberOfActiveJobs = new AtomicLong(0);

        private final AtomicLong numberOfFailureJobs = new AtomicLong(0);
    }

    @PostConstruct
    public void init() {
        Example<JobDocument> jobEx = Example.of(JobDocument.builder().isScheduled(false).build());
        long numberOfJobs = jobDocumentRepository.count(jobEx);
        jobManagementStatistics.totalNumberOfJobs.set(numberOfJobs);
        Example<JobResultDocument> failureJobEx = Example.of(JobResultDocument.builder().jobExecutionStatus(JobExecutionStatus.FAILURE).build());
        long numberOfFailureJobs = jobResultDocumentRepository.count(failureJobEx);
        jobManagementStatistics.numberOfFailureJobs.set(numberOfFailureJobs);
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX)
    public Collection<ComplexValue> getMetricValues() {
        return metricService.getMetrics().values();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-jobs")
    public long getTotalNumberOfJobs() {
        return jobManagementStatistics.totalNumberOfJobs.get();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-failure-jobs")
    public long getTotalNumberOfFailureJobs() {
        return jobManagementStatistics.numberOfFailureJobs.get();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-activate-jobs")
    public long getTotalNumberOfActiveJobs() {
        return jobManagementStatistics.numberOfActiveJobs.get();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-active-schedule-jobs")
    public long getNumberOfScheduleJobs() {
        return scheduleTaskMgmtService.getActiveTasks();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-available-schedule-jobs")
    public long getNumberOfAvailableScheduleJobs() {
        return scheduleTaskMgmtService.getConcurrentAccountLocks().availablePermits();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-available-cpu-jobs")
    public long getNumberOfAvailableCPUJobs() {
        return cpuTaskMgmtService.getConcurrentAccountLocks().availablePermits();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-available-io-jobs")
    public long getNumberOfAvailableIOJobs() {
        return ioTaskMgmtService.getConcurrentAccountLocks().availablePermits();
    }

    @Override
    @LoggingMonitor
    public Map<String, Map<String, String>> getEnabledScheduleJobsGroupByActionId() {
        List<JobDocument> scheduledJobDocuments = jobDocumentRepository.findByIsScheduledTrueAndJobStatus("ACTIVE");
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(scheduledJobDocuments);

        List<Triplet<String, String, String>> jobDocumentMapping = getJobDocumentPairs(scheduledJobDocuments, jobResultDocuments);

        Map<String, List<Triplet<String, String, String>>> scheduleJobMapping = jobDocumentMapping.stream()
                .collect(Collectors.groupingBy(p -> p.getFirst()));

        return scheduleJobMapping.entrySet().stream().map(p -> {
            Map<String, String> jobJobResultMapping =
                    p.getValue().stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
            return new AbstractMap.SimpleEntry<>(p.getKey(), jobJobResultMapping);
        }).collect(Collectors.toMap(SimpleEntry::getKey, SimpleEntry::getValue));
    }

    @Override
    @LoggingMonitor
    public Page<JobOverviewDTO> getJobs(PageRequest pageRequest) {
        Page<JobDocument> jobDocuments = jobDocumentRepository.findAll(pageRequest);
        return getJobOverviewDTOs(jobDocuments);
    }

    @Override
    @LoggingMonitor
    public Page<JobOverviewDTO> getJobsFromAction(String actionId, PageRequest pageRequest) {
        Page<JobDocument> jobDocuments = jobDocumentRepository.findJobByActionId(actionId, pageRequest);
        return getJobOverviewDTOs(jobDocuments);
    }

    @Override
    @LoggingMonitor
    public Map<String, String> getJobsFromAction(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findJobByActionId(actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments)
                .stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
    }

    @Override
    @LoggingMonitor
    public Map<String, String> getEnabledOnetimeJobs(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findByIsScheduledFalseAndJobStatusAndActionId("ACTIVE", actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments)
                .stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
    }

    @Override
    @LoggingMonitor
    public Map<String, String> getEnabledScheduledJobs(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findByIsScheduledTrueAndJobStatusAndActionId("ACTIVE", actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments)
                .stream().collect(Collectors.toMap(Triplet::getSecond, Triplet::getThird));
    }

    @Override
    @LoggingMonitor
    public JobResultDocument getJobResultDocumentByJobId(String jobHash) {
        return jobResultDocumentRepository.findByJobId(jobHash);
    }

    @Override
    @LoggingMonitor
    public void pause(String jobHash) {
        JobDocument jobDocument = getJobDocument(jobHash);
        jobDocument.setJobStatus(JobStatus.PAUSED.name());
        Function<String, InvalidArgumentException> argumentChecker = InvalidArgumentException::new;
        checkThenThrow(!jobDocument.isScheduled(), () -> argumentChecker.apply("Pause only support for schedule jobs"));

        scheduledJobRegistry.entrySet().stream()
                .filter(p -> jobHash.equals(p.getKey()))
                .filter(p -> Objects.nonNull(p.getValue()))
                .peek(p -> LOGGER.info("Delete the schedule tasks - {}", p.getKey()))
                .map(Map.Entry::getValue)
                .forEach(scheduleTaskMgmtService::cancel);
        metricService.removeMetric(jobHash);
        update(jobDocument);
    }

    @Override
    @LoggingMonitor
    public void delete(String jobId) {
        Optional<JobDocument> jobDocumentOptional = jobDocumentRepository.findById(jobId);
        ObjectUtils.checkThenThrow(jobDocumentOptional.isEmpty(), "Cannot find job: " + jobId);
        JobDocument jobDocument = jobDocumentOptional.get();

        if (jobDocument.isScheduled() && jobDocument.getJobStatus() == JobStatus.ACTIVE) {
            LOGGER.info("Delete the schedule tasks for job - {}", jobDocument.getJobName());
            ScheduledFuture<?> scheduledFuture = scheduledJobRegistry.get(jobId);
            scheduleTaskMgmtService.cancel(scheduledFuture);
            LOGGER.info("Delete the metric tasks for job - {}", jobDocument.getJobName());
            metricService.removeMetric(jobId);
            jobDocumentRepository.delete(jobDocument);
        }
        JobResultDocument jobResultDocument = jobResultDocumentRepository.findByJobId(jobId);
        jobResultDocumentRepository.delete(jobResultDocument);
        LOGGER.info("Deleted the job results for job - {}", jobDocument.getJobName());
    }

    @Override
    @LoggingMonitor
    public void deleteJobsByActionId(String actionId) {
        LOGGER.info("Deleted the job result documents belong to action {}", actionId);
        List<JobDocument> jobIds = jobDocumentRepository.findByIsScheduledTrueAndJobStatusAndActionId("ACTIVE", actionId);
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
    @LoggingMonitor
    public void processBulkJobs(ActionExecutionContext actionExecutionContext) {
        boolean isRelayAction = actionExecutionContext.isRelayAction();
        Map<String, String> jobDocumentInAction = actionExecutionContext.getJobDocumentPairs();
        jobDocumentInAction.forEach((jobHash, jobResultHash) -> {
            JobDocument jobDocument = jobDocumentRepository.findById(jobHash).get();
            JobResultDocument jobResultDocument = jobResultDocumentRepository.findById(jobResultHash).get();
            processJob(jobDocument, jobResultDocument, actionExecutionContext.getOnCompletedJobCallback(), isRelayAction);
        });
    }

    @Override
    @LoggingMonitor
    public void processJob(JobDocument jobDocument, JobResultDocument jobResultDocument,
                           BiConsumer<JobExecutionStatus, JobExecutionStatus> callback, boolean isRelayAction) {
        jobManagementStatistics.totalNumberOfJobs.incrementAndGet();
        if (jobDocument.isScheduled() && !isRelayAction) {
            ScheduledFuture<?> scheduledFuture = processScheduleJob(jobDocument, jobResultDocument, callback);
            scheduledJobRegistry.put(jobDocument.getHash(), scheduledFuture);
            return;
        }
        if (jobDocument.isAsync() || isRelayAction) {
            processAsync(jobDocument, jobResultDocument, callback);
            return;
        }
        processPersistenceJob(jobDocument, jobResultDocument, callback);
    }

    @Override
    @LoggingMonitor
    public JobDetailDTO getJob(String hash) {
        JobDocument jobDocument = getJobDocument(hash);
        return JobTransformer.jobDetailDTO(jobDocument);
    }

    @Override
    @LoggingMonitor
    public JobDocument getJobDocument(String hash) {
        Optional<JobDocument> jobDocumentOptional = jobDocumentRepository.findById(hash);
        return jobDocumentOptional.orElseThrow(() -> new EntityNotFoundException("Cannot find job ID: " + hash));
    }

    @Override
    @LoggingMonitor
    public void update(JobDocument jobDocument) {
        jobDocumentRepository.save(jobDocument);
    }


    @Override
    @LoggingMonitor
    public Pair<String, String> initialJobs(JobDefinitionDTO jobDefinitionDTO, String actionId) {
        JobDocument jobDocument = jobDocumentRepository.save(JobTransformer.fromJobDefinition(jobDefinitionDTO, actionId));
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
    @LoggingMonitor
    public void processNonePersistenceJob(JobDefinitionDTO jobDocument) {
        Function<String, InvalidArgumentException> argumentChecker = InvalidArgumentException::new;
        checkThenThrow(jobDocument.isScheduled(), () -> argumentChecker.apply("Schedule jobs is not supported by dry run jobs"));

        List<String> outputTargets = jobDocument.getOutputTargets();
        boolean isContainConsoleOutputOnly = outputTargets.size() == 1 && outputTargets.contains(JobOutputTarget.CONSOLE.name());
        checkThenThrow(!isContainConsoleOutputOnly, () -> argumentChecker.apply("Target output metric is not supported by dry run jobs"));

        try {
            JobResultImmutable jobResultImmutable = process(jobDocument);
            LOGGER.info("Job result: {}", jobResultImmutable);
        } catch (Exception exception) {
            LOGGER.error("An exception occurred while processing job", exception);
        }
    }

    @Override
    @LoggingMonitor
    public void update(String hash, JobDefinitionDTO jobDefinitionDTO) {
        JobDocument persistenceJobDocument = getJobDocument(hash);
        persistenceJobDocument.updateFromJobDefinitionDTO(jobDefinitionDTO);
        jobDocumentRepository.save(persistenceJobDocument);
    }

    private Page<JobOverviewDTO> getJobOverviewDTOs(Page<JobDocument> jobDocuments) {
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);

        return jobDocuments.map(jobDocument -> {
            String jobId = jobDocument.getHash();
            Optional<JobResultDocument> jobExecutionResultDocument =
                    jobResultDocuments.stream().filter(p -> p.getJobId().equals(jobId)).findFirst();
            if (jobExecutionResultDocument.isEmpty()) {
                return null;
            }
            Supplier<JobResultDocument> defaultJobResult = () -> JobResultDocument.builder().build();
            JobResultDocument jobStat = jobExecutionResultDocument.orElseGet(defaultJobResult);
            String jobState = Objects.isNull(jobStat.getJobState()) ? "" : jobStat.getJobState().name();
            String jobStatus = Objects.isNull(jobStat.getJobExecutionStatus()) ? "" : jobStat.getJobExecutionStatus().name();
            return JobOverviewDTO.builder()
                    .name(jobDocument.getJobName())
                    .hash(jobId)
                    .jobState(jobState)
                    .jobExecutionStatus(jobStatus)
                    .status(jobDocument.getJobStatus().name())
                    .jobExecutionStatus(jobStat.getJobExecutionStatus().name())
                    .isSchedule(jobDocument.isScheduled())
                    .startedAt(jobStat.getStartedAt())
                    .updatedAt(jobStat.getUpdatedAt())
                    .elapsedTime(DurationFormatUtils.formatDuration(jobStat.getElapsedTime(), "HH:mm:ss.S"))
                    .failureNotes(jobStat.getFailureNotes())
                    .actionHash(jobDocument.getActionId())
                    .build();
        });
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
                                                                      List<JobResultDocument> jobResultDocuments) {
        Map<String, JobResultDocument> jobResultMapping = jobResultDocuments.stream()
                .map(p -> new SimpleEntry<>(p.getJobId(), p))
                .collect(Collectors.toMap(SimpleEntry::getKey, SimpleEntry::getValue));

        return jobDocuments.stream()
                .map(documentHash -> {
                    String jobDocumentHash = documentHash.getHash();
                    JobResultDocument jobResultDocument = jobResultMapping.get(jobDocumentHash);
                    return Triplet.of(documentHash.getActionId(), jobDocumentHash, jobResultDocument.getHash());
                })
                .toList();
    }

    private JobResultImmutable process(JobImmutable jobImmutable) {
        String jobName = jobImmutable.getJobName();
        String templateName = String.format("%s-%s", jobName, jobImmutable.getJobCategory());
        String configurations = jobImmutable.getConfigurations();
        @SuppressWarnings("unchecked")
        CheckedSupplier<Map<String, Object>> configurationToMapSupplier =
                () -> objectMapper.readValue(configurations, Map.class);
        Map<String, Object> configurationMap = configurationToMapSupplier.get();

        String defaultTemplateEngine = DEFAULT_CONFIGURATIONS.get(TEMPLATE_ENGINE_NAME);
        String templateEngineName = (String) configurationMap.getOrDefault(TEMPLATE_ENGINE_NAME, defaultTemplateEngine);
        TemplateEngineEnum templateEngine = TemplateEngineEnum.getTemplateEngineFromName(templateEngineName);
        String jobContent = templateEngine.process(templateName, jobImmutable.getJobContent(), configurationMap);

        Map<String, Object> jobExecutionContext = new HashMap<>(configurationMap);
        jobExecutionContext.put("templateEngine", templateEngine);
        return scriptEngineService.execute(jobContent, jobExecutionContext);
    }

    private void processPersistenceJob(JobDocument jobDocument, JobResultDocument jobResultDocument,
                                       BiConsumer<JobExecutionStatus, JobExecutionStatus> onJobStatusChange) {

        jobManagementStatistics.numberOfActiveJobs.incrementAndGet();

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

            JobResultImmutable jobResult = process(jobDocument);
            processOutputTargets(jobDocument, jobDocument.getJobName(), jobResult);

            nextJobStatus = StringUtils.isNotEmpty(jobResult.getException()) ? JobExecutionStatus.FAILURE : JobExecutionStatus.SUCCESS;
            jobException = jobResult.getException();

        } catch (Exception exception) {
            LOGGER.error("An exception occurred while processing job", exception);
            jobException = exception.getMessage();
        } finally {
            updateJobResultDocument(jobResultDocument, nextJobStatus, currentEpochTimeInMillisecond, jobException);
            processJobResultCallback(onJobStatusChange, prevJobStatus, nextJobStatus);
        }
    }

    private ScheduledFuture<?> processScheduleJob(JobDocument jobDocument, JobResultDocument jobResultDocument,
                                                  BiConsumer<JobExecutionStatus, JobExecutionStatus> callback) {
        String jobName = jobDocument.getJobName();
        TimeUnit timeUnit = TimeUnit.valueOf(jobDocument.getScheduleUnit());
        Callable<Void> jobProcessRunnable = () -> {
            Optional<JobDocument> jobDocument1 = jobDocumentRepository.findById(jobDocument.getHash());
            ObjectUtils.checkThenThrow(jobDocument1.isEmpty(), "Cannot find job: " + jobName);
            processPersistenceJob(jobDocument1.get(), jobResultDocument, callback);
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

    private void processAsync(JobDocument jobDocument, JobResultDocument jobResultDocument,
                              BiConsumer<JobExecutionStatus, JobExecutionStatus> callback) {
        Runnable jobProcessRunnable = () -> processPersistenceJob(jobDocument, jobResultDocument, callback);
        if (jobDocument.getJobCategory() == JobCategory.CPU) {
            LOGGER.info("Using CPU threads to execute job: {}", jobDocument.getJobName());
            cpuTaskMgmtService.execute(jobProcessRunnable);
            return;
        }
        LOGGER.info("Using IO threads to execute job: {}", jobDocument.getJobName());
        ioTaskMgmtService.execute(jobProcessRunnable);
    }

    private void processJobResultCallback(BiConsumer<JobExecutionStatus, JobExecutionStatus> onJobStatusChange,
                                          JobExecutionStatus prevJobStatus,
                                          JobExecutionStatus nextJobStatus) {

        onJobStatusChange.accept(prevJobStatus, nextJobStatus);
        if (nextJobStatus == JobExecutionStatus.FAILURE) {
            jobManagementStatistics.numberOfFailureJobs.incrementAndGet();
        }
        jobManagementStatistics.numberOfActiveJobs.decrementAndGet();
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

    private void processOutputTargets(JobDocument jobDocument, String jobName, JobResultImmutable jobResult) {
        List<String> jobOutputTargets = jobDocument.getOutputTargets();
        jobOutputTargets.forEach(target -> {
            JobOutputTarget jobOutputTarget = JobOutputTarget.valueOf(target);
            switch (jobOutputTarget) {
                case CONSOLE -> LOGGER.info("Async job: {} result: {}", jobName, jobResult);
                case METRIC -> processOutputData(jobResult, jobName);
                default -> throw new AppException("Unsupported output target " + target);
            }
        });
    }

    private void processOutputData(JobResultImmutable jobResult, String jobName) {
        String metricNamePrefix = JOB_MANAGER_METRIC_NAME_PREFIX + "-for-" + jobName;
        if (jobResult instanceof JobResult singleJobResult) {
            ArrayList<MetricTag> metricTags = new ArrayList<>();
            MetricTag metricTag = new MetricTag(singleJobResult.getData());
            metricTag.setAttributes(Map.of("name", metricNamePrefix));
            metricTags.add(metricTag);
            metricService.setMetric(metricNamePrefix, metricTags);
            return;
        }

        if (jobResult instanceof JobResultDict jobResultDict) {
            Map<String, String> multipleJobResultMap = jobResultDict.getData();
            LOGGER.info("Reset all metric values for related job {} back to 0", metricNamePrefix);
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
