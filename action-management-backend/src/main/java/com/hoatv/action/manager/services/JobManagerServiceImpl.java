package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.dtos.*;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.fwk.common.exceptions.AppException;
import com.hoatv.fwk.common.services.CheckedSupplier;
import com.hoatv.fwk.common.services.TemplateEngineEnum;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import com.hoatv.fwk.common.ultilities.Pair;
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

import java.util.AbstractMap.SimpleEntry;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Collectors;

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
        Example<JobResultDocument> failureJobEx = Example.of(JobResultDocument.builder().jobStatus(JobStatus.FAILURE).build());
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


    private List<JobResultDocument> getJobResultDocuments(Page<JobDocument> jobDocuments) {
        List<String> jobIds = jobDocuments.stream().map(JobDocument::getHash).toList();
        return jobResultDocumentRepository.findByJobIdIn(jobIds);
    }

    private List<JobResultDocument> getJobResultDocuments(List<JobDocument> jobDocuments) {
        List<String> jobIds = jobDocuments.stream().map(JobDocument::getHash).toList();
        return jobResultDocumentRepository.findByJobIdIn(jobIds);
    }

    private List<Pair<JobDocument, JobResultDocument>> getJobDocumentPairs(List<JobDocument> jobDocuments,
                                                                           List<JobResultDocument> jobResultDocuments) {
        Map<String, JobResultDocument> jobResultMapping = jobResultDocuments.stream()
                .map(p -> new SimpleEntry<>(p.getJobId(), p))
                .collect(Collectors.toMap(SimpleEntry::getKey, SimpleEntry::getValue));

        return jobDocuments.stream().map(jobDocument -> Pair.of(jobDocument,
                jobResultMapping.get(jobDocument.getHash()))).toList();
    }

    @Override
    public long count(Example<JobDocument> example) {
        return jobDocumentRepository.count(example);
    }

    @Override
    public List<Pair<JobDocument, JobResultDocument>> getScheduleJobPairs() {
        List<JobDocument> scheduledJobDocuments = jobDocumentRepository.findByIsScheduledTrue();
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(scheduledJobDocuments);
        return getJobDocumentPairs(scheduledJobDocuments, jobResultDocuments);
    }

    @Override
    public Page<JobOverviewDTO> getJobs(PageRequest pageRequest) {
        Page<JobDocument> jobDocuments = jobDocumentRepository.findAll(pageRequest);
        return getJobOverviewDTOs(jobDocuments);
    }

    @Override
    public Page<JobOverviewDTO> getJobsFromAction(String actionId, PageRequest pageRequest) {
        Page<JobDocument> jobDocuments = jobDocumentRepository.findJobByActionId(actionId, pageRequest);
        return getJobOverviewDTOs(jobDocuments);
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
            String jobStatus = Objects.isNull(jobStat.getJobStatus()) ? "" : jobStat.getJobStatus().name();
            return JobOverviewDTO.builder()
                    .name(jobDocument.getJobName())
                    .hash(jobId)
                    .jobState(jobState)
                    .jobStatus(jobStatus)
                    .isSchedule(jobDocument.isScheduled())
                    .startedAt(jobStat.getStartedAt())
                    .updatedAt(jobStat.getUpdatedAt())
                    .elapsedTime(DurationFormatUtils.formatDuration(jobStat.getElapsedTime(), "HH:mm:ss.S"))
                    .failureNotes(jobStat.getFailureNotes())
                    .build();
        });
    }

    @Override
    public List<Pair<JobDocument, JobResultDocument>> getJobsFromAction(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findJobByActionId(actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments);
    }

    @Override
    public List<Pair<JobDocument, JobResultDocument>> getOneTimeJobsFromAction(String actionId) {
        List<JobDocument> jobDocuments = jobDocumentRepository.findByIsScheduledFalseAndActionId(actionId);
        List<JobResultDocument> jobResultDocuments = getJobResultDocuments(jobDocuments);
        return getJobDocumentPairs(jobDocuments, jobResultDocuments);
    }

    @Override
    @LoggingMonitor
    public void deleteJobsByActionId(String actionId) {
        LOGGER.info("Deleted the job result documents belong to action {}", actionId);
        List<JobDocumentRepository.JobId> jobIds = jobDocumentRepository.findByIsScheduledTrueAndActionId(actionId);
        List<String> jobIdStrings = jobIds.stream().map(JobDocumentRepository.JobId::getHash).toList();

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
    public void processBulkJobs(List<ActionExecutionContext> actionExecutionContexts) {
        actionExecutionContexts.forEach(this::processBulkJobs);
    }

    @Override
    public void processBulkJobs(ActionExecutionContext actionExecutionContext) {
        List<Pair<JobDocument, JobResultDocument>> jobDocumentTriplets =
                actionExecutionContext.getJobDocumentPairs();
        jobDocumentTriplets.forEach(pair -> {
            JobDocument jobDocument = pair.getKey();
            JobResultDocument jobResultDocument = pair.getValue();
            processJob(jobDocument, jobResultDocument, actionExecutionContext.getOnCompletedJobCallback());
        });
    }

    @Override
    public void processJob(JobDocument jobDocument, JobResultDocument jobResultDocument, Consumer<JobStatus> callback) {
        jobManagementStatistics.totalNumberOfJobs.incrementAndGet();
        if (jobDocument.isScheduled()) {
            ScheduledFuture<?> scheduledFuture = processScheduleJob(jobDocument, jobResultDocument, callback);
            scheduledJobRegistry.put(jobDocument.getHash(), scheduledFuture);
            return;
        }
        if (jobDocument.isAsync()) {
            processAsync(jobDocument, jobResultDocument, callback);
            return;
        }
        processSync(jobDocument, jobResultDocument, callback);
    }

    private ScheduledFuture<?> processScheduleJob(JobDocument jobDocument, JobResultDocument jobResultDocument,
                                                  Consumer<JobStatus> callback) {
        Callable<Void> jobProcessRunnable = () -> {
            processSync(jobDocument, jobResultDocument, callback);
            return null;
        };
        String jobName = jobDocument.getJobName();
        TimeUnit timeUnit = TimeUnit.valueOf(jobDocument.getScheduleUnit());
        long scheduleIntervalInMs = timeUnit.toMillis(jobDocument.getScheduleInterval());
        TaskEntry taskEntry = new TaskEntry(jobName, ACTION_MANAGER, jobProcessRunnable, 0, scheduleIntervalInMs);
        ScheduledFuture<?> scheduledFuture = scheduleTaskMgmtService.scheduleFixedRateTask(taskEntry, 1000, TimeUnit.MILLISECONDS);
        if (Objects.isNull(scheduledFuture)) {
            LOGGER.error("Reached to maximum number of schedule thread, no more thread to process {}", jobName);
            return null;
        }
        return scheduledFuture;
    }

    private void processSync(JobDocument jobDocument, JobResultDocument jobResultDocument, Consumer<JobStatus> onJobStatusChange) {
        jobManagementStatistics.numberOfActiveJobs.incrementAndGet();
        long currentEpochTimeInMillisecond = DateTimeUtils.getCurrentEpochTimeInMillisecond();
        try {
            if (jobResultDocument.getStartedAt() == 0) {
                jobResultDocument.setStartedAt(currentEpochTimeInMillisecond);
            }
            jobResultDocument.setUpdatedAt(currentEpochTimeInMillisecond);
            jobResultDocument.setJobStatus(JobStatus.PROCESSING);
            jobResultDocumentRepository.save(jobResultDocument);

            String jobName = jobDocument.getJobName();
            String templateName = String.format("%s-%s", jobName, jobDocument.getJobCategory());
            String configurations = jobDocument.getConfigurations();
            @SuppressWarnings("unchecked")
            CheckedSupplier<Map<String, Object>> configurationToMapSupplier =
                    () -> objectMapper.readValue(configurations, Map.class);
            Map<String, Object> configurationMap = configurationToMapSupplier.get();

            String defaultTemplateEngine = DEFAULT_CONFIGURATIONS.get(TEMPLATE_ENGINE_NAME);
            String templateEngineName = (String) configurationMap.getOrDefault(TEMPLATE_ENGINE_NAME, defaultTemplateEngine);
            TemplateEngineEnum templateEngine = TemplateEngineEnum.getTemplateEngineFromName(templateEngineName);
            String jobContent = templateEngine.process(templateName, jobDocument.getJobContent(), configurationMap);

            Map<String, Object> jobExecutionContext = new HashMap<>(configurationMap);
            jobExecutionContext.put("templateEngine", templateEngine);
            JobResult jobResult = scriptEngineService.execute(jobContent, jobExecutionContext);
            processOutputTargets(jobDocument, jobName, jobResult);

            JobStatus nextJobStatus = StringUtils.isNotEmpty(jobResult.getException()) ? JobStatus.FAILURE : JobStatus.SUCCESS;
            updateJobResultDocument(jobResultDocument, nextJobStatus, currentEpochTimeInMillisecond, jobResult.getException());
            processJobResultCallback(jobDocument, onJobStatusChange, nextJobStatus);
        } catch (Exception exception) {
            LOGGER.error("An exception occurred while processing job", exception);
            updateJobResultDocument(jobResultDocument, JobStatus.FAILURE, currentEpochTimeInMillisecond, exception.getMessage());
            processJobResultCallback(jobDocument, onJobStatusChange, JobStatus.FAILURE);
        }
    }

    private void processJobResultCallback(JobDocument jobDocument,
                                          Consumer<JobStatus> onJobStatusChange, JobStatus nextJobStatus) {
        if (!jobDocument.isScheduled()) {
            onJobStatusChange.accept(nextJobStatus);
            if (nextJobStatus == JobStatus.FAILURE) {
                jobManagementStatistics.numberOfFailureJobs.incrementAndGet();
            }
        }
        jobManagementStatistics.numberOfActiveJobs.decrementAndGet();
    }

    private void updateJobResultDocument(JobResultDocument jobResultDocument, JobStatus nextJobStatus, long startedAt, String jobResult) {
        long endedAt = DateTimeUtils.getCurrentEpochTimeInMillisecond();
        jobResultDocument.setJobState(JobState.COMPLETED);
        jobResultDocument.setJobStatus(nextJobStatus);
        jobResultDocument.setEndedAt(endedAt);
        jobResultDocument.setElapsedTime(endedAt - startedAt);
        jobResultDocument.setFailureNotes(jobResult);
        jobResultDocumentRepository.save(jobResultDocument);
    }

    private void processOutputTargets(JobDocument jobDocument, String jobName, JobResult jobResult) {
        List<String> jobOutputTargets = jobDocument.getOutputTargets();
        jobOutputTargets.forEach(target -> {
            JobOutputTarget jobOutputTarget = JobOutputTarget.valueOf(target);
            switch (jobOutputTarget) {
                case CONSOLE -> LOGGER.info("Async job: {} result: {}", jobName, jobResult);
                case METRIC -> {
                    ArrayList<MetricTag> metricTags = new ArrayList<>();
                    MetricTag metricTag = new MetricTag(jobResult.getData());
                    metricTag.setAttributes(Map.of("name", JOB_MANAGER_METRIC_NAME_PREFIX + "-for-" + jobName));
                    metricTags.add(metricTag);
                    metricService.setMetric(jobDocument.getHash(), metricTags);
                }
                default -> throw new AppException("Unsupported output target " + target);
            }
        });
    }

    private void processAsync(JobDocument jobDocument, JobResultDocument jobResultDocument,
                              Consumer<JobStatus> callback) {
        Runnable jobProcessRunnable = () -> processSync(jobDocument, jobResultDocument, callback);
        if (jobDocument.getJobCategory() == JobCategory.CPU) {
            LOGGER.info("Using CPU threads to execute job: {}", jobDocument.getJobName());
            cpuTaskMgmtService.execute(jobProcessRunnable);
            return;
        }
        LOGGER.info("Using IO threads to execute job: {}", jobDocument.getJobName());
        ioTaskMgmtService.execute(jobProcessRunnable);
    }

    @Override
    @LoggingMonitor
    public Pair<JobDocument, JobResultDocument> initialJobs(JobDefinitionDTO jobDefinitionDTO, String actionId) {
        JobDocument jobDocument = jobDocumentRepository.save(JobDocument.fromJobDefinition(jobDefinitionDTO, actionId));
        JobResultDocument.JobResultDocumentBuilder jobResultDocumentBuilder = JobResultDocument.builder()
                .jobState(JobState.INITIAL)
                .jobStatus(JobStatus.PENDING)
                .actionId(actionId)
                .createdAt(DateTimeUtils.getCurrentEpochTimeInSecond())
                .jobId(jobDocument.getHash());
        JobResultDocument jobResultDocument = jobResultDocumentRepository.save(jobResultDocumentBuilder.build());
        return Pair.of(jobDocument, jobResultDocument);
    }
}
