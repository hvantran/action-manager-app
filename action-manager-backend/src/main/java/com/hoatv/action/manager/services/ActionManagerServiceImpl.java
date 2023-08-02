package com.hoatv.action.manager.services;

import static com.hoatv.fwk.common.ultilities.ObjectUtils.checkThenThrow;

import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatisticsDocument;
import com.hoatv.action.manager.collections.ActionStatisticsDocument.ActionStatisticsDocumentBuilder;
import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.collections.JobExecutionStatus;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.ActionStatisticsDocumentRepository;
import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.fwk.common.exceptions.InvalidArgumentException;
import com.hoatv.fwk.common.services.BiCheckedConsumer;
import com.hoatv.fwk.common.services.CheckedFunction;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import com.hoatv.fwk.common.ultilities.GenericKeyedLock;
import com.hoatv.fwk.common.ultilities.Pair;
import com.hoatv.metric.mgmt.annotations.Metric;
import com.hoatv.metric.mgmt.annotations.MetricProvider;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@MetricProvider(application = MetricProviders.OTHER_APPLICATION, category = "action-manager-stats-data")
public class ActionManagerServiceImpl implements ActionManagerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActionManagerServiceImpl.class);

    private final ActionDocumentRepository actionDocumentRepository;

    private final ActionStatisticsDocumentRepository actionStatisticsDocumentRepository;

    private final JobManagerService jobManagerService;

    private final ActionStatistics actionStatistics;

    private final GenericKeyedLock<String> jobStatusUpdaterLocks;


    @Autowired
    public ActionManagerServiceImpl(ActionDocumentRepository actionDocumentRepository,
                                    JobManagerService jobManagerService,
                                    ActionStatisticsDocumentRepository actionStatisticsDocumentRepository) {
        this.actionDocumentRepository = actionDocumentRepository;
        this.jobManagerService = jobManagerService;
        this.actionStatistics = new ActionStatistics();
        this.actionStatisticsDocumentRepository = actionStatisticsDocumentRepository;
        this.jobStatusUpdaterLocks = new GenericKeyedLock<>();
    }

    private static class ActionStatistics {
        private final AtomicLong numberOfActions = new AtomicLong(0);
        private final AtomicLong numberOfReplayActions = new AtomicLong(0);
    }

    @Metric(name = "action-manager-number-of-actions")
    public long getNumberOfActions() {
        return actionStatistics.numberOfActions.get();
    }

    @Metric(name = "action-manager-number-of-replay-actions")
    public long getNumberOfReplayActions() {
        return actionStatistics.numberOfReplayActions.get();
    }


    @PostConstruct
    public void initScheduleJobOnStartup() {
        long numberOfActions = actionDocumentRepository.count();
        actionStatistics.numberOfActions.set(numberOfActions);

        Map<String, Map<String, String>> actionJobMapping = jobManagerService.getEnabledScheduleJobsGroupByActionId();
        Set<String> startupActionIds = actionJobMapping.keySet();

        List<ActionDocument> actionDocuments = actionDocumentRepository.findByHashIn(startupActionIds);
        List<ActionStatisticsDocument> actionStatics = actionStatisticsDocumentRepository.findByActionIdIn(startupActionIds);
        Map<String, List<ActionStatisticsDocument>> actionStatisticMapping = actionStatics.stream()
                .collect(Collectors.groupingBy(ActionStatisticsDocument::getActionId));

        CheckedFunction<ActionDocument, ActionExecutionContext> executionContextFunction =
                getActionExecutionContext(actionJobMapping, actionStatisticMapping);
        List<ActionExecutionContext> executionContexts = actionDocuments.stream()
                .map(executionContextFunction)
                .filter(Objects::nonNull)
                .toList();
        jobManagerService.processBulkJobs(executionContexts);
    }

    private CheckedFunction<ActionDocument, ActionExecutionContext> getActionExecutionContext(
            Map<String, Map<String, String>> actionJobMapping,
            Map<String, List<ActionStatisticsDocument>> actionStatisticMapping) {
        return actionDocument -> {
            try {
                ActionStatisticsDocument actionStatisticsDocument =
                        actionStatisticMapping.get(actionDocument.getHash()).get(0);
                return ActionExecutionContext.builder()
                        .actionDocument(actionDocument)
                        .jobDocumentPairs(actionJobMapping.get(actionDocument.getHash()))
                        .actionStatisticsDocument(actionStatisticsDocument)
                        .onCompletedJobCallback(onCompletedJobCallback(actionStatisticsDocument))
                        .build();
            } catch (Exception exception) {
                LOGGER.info("Cannot get action statistic from action id {}", actionDocument.getHash(), exception);
                return null;
            }
        };
    }

    @Override
    @LoggingMonitor
    public Page<ActionOverviewDTO> getAllActionsWithPaging(String search, Pageable pageable) {
        Page<ActionDocument> actionDocuments = actionDocumentRepository.findActionByName(search, pageable);
        return getActionOverviewDTOS(actionDocuments);
    }

    @Override
    @LoggingMonitor
    public Page<ActionOverviewDTO> getAllActionsWithPaging(Pageable pageable) {
        Page<ActionDocument> actionDocuments = actionDocumentRepository.findAll(pageable);
        return getActionOverviewDTOS(actionDocuments);
    }

    @Override
    @LoggingMonitor
    public Optional<ActionDefinitionDTO> getActionById(String hash) {
        return actionDocumentRepository.findById(hash)
                .map(ActionDocument::toActionDefinition);
    }

    @Override
    public Optional<ActionDefinitionDTO> setFavoriteActionValue(String hash, boolean isFavorite) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(hash);
        if (actionDocumentOptional.isEmpty()) {
            return Optional.empty();
        }
        ActionDocument actionDocument = actionDocumentOptional.get();
        actionDocument.setFavorite(isFavorite);
        ActionDocument document = actionDocumentRepository.save(actionDocument);
        return Optional.of(ActionDocument.toActionDefinition(document));
    }

    @Override
    public void dryRunAction(ActionDefinitionDTO actionDefinition) {
        actionDefinition.getJobs().forEach(jobManagerService::processNonePersistenceJob);
    }

    @Override
    @LoggingMonitor
    public String processAction(ActionDefinitionDTO actionDefinition) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContext(actionDefinition);
        jobManagerService.processBulkJobs(actionExecutionContext);
        actionStatistics.numberOfActions.incrementAndGet();
        return actionExecutionContext.getActionDocument().getHash();
    }

    @Override
    @LoggingMonitor
    public String addJobsToAction(String actionId, List<JobDefinitionDTO> jobDefinitionDTOs) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContextForNewJobs(actionId, jobDefinitionDTOs);
        jobManagerService.processBulkJobs(actionExecutionContext);
        actionStatistics.numberOfActions.incrementAndGet();
        return actionId;
    }

    @Override
    @LoggingMonitor
    public boolean replayAction(String actionId) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContextForReplay(actionId);
        jobManagerService.processBulkJobs(actionExecutionContext);
        actionStatistics.numberOfReplayActions.incrementAndGet();
        return true;
    }

    @Override
    @LoggingMonitor
    public void deleteAction(String hash) {
        actionDocumentRepository.deleteById(hash);
        actionStatisticsDocumentRepository.deleteByActionId(hash);
        jobManagerService.deleteJobsByActionId(hash);
        actionStatistics.numberOfActions.decrementAndGet();
    }

    private Page<ActionOverviewDTO> getActionOverviewDTOS(Page<ActionDocument> actionDocuments) {
        Set<String> actionIds = actionDocuments.stream()
                .map(ActionDocument::getHash)
                .collect(Collectors.toSet());
        List<ActionStatisticsDocument> actionStatics = actionStatisticsDocumentRepository.findByActionIdIn(actionIds);
        return actionDocuments.map(actionDocument -> {
            String actionId = actionDocument.getHash();
            Optional<ActionStatisticsDocument> actionStatistic =
                    actionStatics.stream().filter(p -> p.getActionId().equals(actionId)).findFirst();

            Supplier<ActionStatisticsDocument> defaultActionStat = () -> ActionStatisticsDocument.builder().build();
            ActionStatisticsDocument actionStat = actionStatistic.orElseGet(defaultActionStat);
            long numberOfJobs = actionStat.getNumberOfJobs();
            long numberOfFailureJobs = actionStat.getNumberOfFailureJobs();
            long numberOfSuccessJobs = actionStat.getNumberOfSuccessJobs();
            long numberOfScheduleJobs = actionStat.getNumberOfScheduleJobs();

            return ActionOverviewDTO.builder()
                    .name(actionDocument.getActionName())
                    .hash(actionId)
                    .numberOfScheduleJobs(numberOfScheduleJobs)
                    .numberOfFailureJobs(numberOfFailureJobs)
                    .numberOfJobs(numberOfJobs)
                    .isFavorite(actionDocument.isFavorite())
                    .createdAt(actionDocument.getCreatedAt())
                    .numberOfSuccessJobs(numberOfSuccessJobs)
                    .build();
        });
    }

    private ActionExecutionContext getActionExecutionContextForNewJobs(String actionId,
                                                                       List<JobDefinitionDTO> jobDefinitionDTOs) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(actionId);
        ActionDocument actionDocument = actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + actionId));
        ActionStatisticsDocument actionStatisticsDocument = actionStatisticsDocumentRepository.findByActionId(actionId);

        Map<String, String> jobDocumentPairs = getJobDocumentPairs(jobDefinitionDTOs, actionDocument);
        LOGGER.info("ActionExecutionContext: jobDocumentPairs - {}", jobDocumentPairs);

        long scheduledJobIncreases = jobDefinitionDTOs.stream().filter(JobDefinitionDTO::isScheduled).count();
        long numberOfScheduleJobs = actionStatisticsDocument.getNumberOfScheduleJobs();
        actionStatisticsDocument.setNumberOfScheduleJobs(numberOfScheduleJobs + scheduledJobIncreases);
        long numberOfJobs = actionStatisticsDocument.getNumberOfJobs();
        actionStatisticsDocument.setNumberOfJobs(numberOfJobs + jobDefinitionDTOs.size());
        actionStatisticsDocumentRepository.save(actionStatisticsDocument);

        BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback = onCompletedJobCallback(actionStatisticsDocument);
        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .actionStatisticsDocument(actionStatisticsDocument)
                .jobDocumentPairs(jobDocumentPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
                .build();
    }

    private Map<String, String> getJobDocumentPairs(List<JobDefinitionDTO> jobDefinitionDTOs,
                                                    ActionDocument actionDocument) {
        return jobDefinitionDTOs.stream()
                .map(p -> jobManagerService.initialJobs(p, actionDocument.getHash()))
                .collect(Collectors.toMap(Pair::getKey, Pair::getValue));
    }


    private ActionExecutionContext getActionExecutionContextForReplay(String actionId) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(actionId);
        ActionDocument actionDocument = actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + actionId));

        ActionStatisticsDocument actionStatisticsDocument = actionStatisticsDocumentRepository.findByActionId(actionId);
        Map<String, String> jobDocumentPairs = jobManagerService.getEnabledOnetimeJobs(actionId);
        Map<String, String> scheduledJobDocumentPairs = jobManagerService.getEnabledScheduledJobs(actionId);

        BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback = onCompletedJobCallback(actionStatisticsDocument);
        Map<String, String> jobDocumentProcessPairs = new HashMap<>(jobDocumentPairs);
        jobDocumentProcessPairs.putAll(scheduledJobDocumentPairs);
        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .actionStatisticsDocument(actionStatisticsDocument)
                .jobDocumentPairs(jobDocumentProcessPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
                .isRelayAction(true)
                .build();
    }

    private ActionExecutionContext getActionExecutionContext(ActionDefinitionDTO actionDefinition) {
        ActionDocument actionDocument = actionDocumentRepository.save(ActionDocument.fromActionDefinition(actionDefinition));
        LOGGER.info("ActionExecutionContext: actionDocument - {}", actionDocument);
        long numberOfScheduleJobs = actionDefinition.getJobs().stream().filter(JobDefinitionDTO::isScheduled).count();
        ActionStatisticsDocumentBuilder statisticsDocumentBuilder = ActionStatisticsDocument.builder();
        statisticsDocumentBuilder.createdAt(DateTimeUtils.getCurrentEpochTimeInSecond());
        statisticsDocumentBuilder.actionId(actionDocument.getHash());
        statisticsDocumentBuilder.numberOfJobs(actionDefinition.getJobs().size());
        statisticsDocumentBuilder.numberOfScheduleJobs(numberOfScheduleJobs);
        ActionStatisticsDocument actionStatisticsDocument =
                actionStatisticsDocumentRepository.save(statisticsDocumentBuilder.build());
        LOGGER.info("ActionExecutionContext: actionStatisticsDocument - {}", actionStatisticsDocument);

        List<JobDefinitionDTO> definitionJobs = actionDefinition.getJobs();
        Map<String, String> jobDocumentPairs = getJobDocumentPairs(definitionJobs, actionDocument);
        LOGGER.info("ActionExecutionContext: jobDocumentPairs - {}", jobDocumentPairs);

        BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback = onCompletedJobCallback(actionStatisticsDocument);

        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .actionStatisticsDocument(actionStatisticsDocument)
                .jobDocumentPairs(jobDocumentPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
                .build();
    }

    @Override
    public void resumeJob(String jobHash) {
        JobDocument jobDocument = jobManagerService.getJobDocument(jobHash);
        jobDocument.setPaused(false);
        JobResultDocument jobResultDocument = jobManagerService.getJobResultDocumentByJobId(jobHash);
        ActionStatisticsDocument statisticsDocument = actionStatisticsDocumentRepository.findByActionId(jobDocument.getActionId());
        Function<String, InvalidArgumentException> argumentChecker = InvalidArgumentException::new;
        checkThenThrow(!jobDocument.isScheduled(),  () -> argumentChecker.apply("Resume only support for schedule jobs"));
        jobManagerService.update(jobDocument);
        jobManagerService.processJob(jobDocument, jobResultDocument, onCompletedJobCallback(statisticsDocument), false);
    }

    private BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback(ActionStatisticsDocument actionStatisticsDocument) {
        return (prevJobStatus, currentJobStatus) -> {
            LOGGER.info("Prev status: {} -> Next status: {}", prevJobStatus, currentJobStatus);
            if (prevJobStatus == currentJobStatus) {
                return;
            }

            String documentHash = actionStatisticsDocument.getHash();
            jobStatusUpdaterLocks.putIfAbsent(documentHash, new Semaphore(1, true));

            if (jobStatusUpdaterLocks.tryAcquire(documentHash, 5000, TimeUnit.MILLISECONDS)) {
                try {
                    long numberOfJobs = actionStatisticsDocument.getNumberOfJobs();
                    long numberOfFailureJobs = actionStatisticsDocument.getNumberOfFailureJobs();
                    long numberOfSuccessJobs = actionStatisticsDocument.getNumberOfSuccessJobs();

                    JobStatusCounter result =
                            getJobStatusCounter(prevJobStatus, currentJobStatus, numberOfFailureJobs, numberOfSuccessJobs);

                    actionStatisticsDocument.setNumberOfSuccessJobs(result.nextNumberOfSuccessJobs());
                    actionStatisticsDocument.setNumberOfFailureJobs(result.nextNumberOfFailureJobs());

                    long currentProcessedJobs = numberOfFailureJobs + numberOfSuccessJobs;
                    actionStatisticsDocument.setPercentCompleted((double) currentProcessedJobs * 100 / numberOfJobs);

                    actionStatisticsDocumentRepository.save(actionStatisticsDocument);
                } finally {
                    jobStatusUpdaterLocks.release(documentHash);
                }
            } else {
                LOGGER.error("Cannot get lock on completed job callback function");
            }
        };
    }

    private static JobStatusCounter getJobStatusCounter(JobExecutionStatus prevJobStatus, JobExecutionStatus currentJobStatus,
                                                        long numberOfFailureJobs, long numberOfSuccessJobs) {
        AtomicInteger numberOfSuccessCounter = new AtomicInteger(0);
        AtomicInteger numberOfFailureCounter = new AtomicInteger(0);

        if (Objects.isNull(prevJobStatus)) {
            if (Objects.requireNonNull(currentJobStatus) == JobExecutionStatus.SUCCESS) {
                numberOfSuccessCounter.incrementAndGet();
            } else {
                numberOfFailureCounter.incrementAndGet();
            }
        } else if (prevJobStatus == JobExecutionStatus.FAILURE && currentJobStatus == JobExecutionStatus.SUCCESS) {
            numberOfSuccessCounter.incrementAndGet();
            numberOfFailureCounter.decrementAndGet();
        } else if (prevJobStatus == JobExecutionStatus.PENDING && currentJobStatus == JobExecutionStatus.SUCCESS) {
            numberOfSuccessCounter.incrementAndGet();
        } else {
            numberOfSuccessCounter.decrementAndGet();
            numberOfFailureCounter.incrementAndGet();
        }

        LOGGER.info("Number of increase success jobs: {}, number of increase failure jobs: {}",
                numberOfSuccessCounter.get(),
                numberOfFailureCounter.get());

        long nextNumberOfSuccessJobs = numberOfSuccessJobs + numberOfSuccessCounter.get();
        long nextNumberOfFailureJobs = numberOfFailureJobs + numberOfFailureCounter.get();
        LOGGER.info("Number of success jobs: {}, number of failure jobs: {}",
                nextNumberOfSuccessJobs,
                nextNumberOfFailureJobs);
        return new JobStatusCounter(nextNumberOfSuccessJobs, nextNumberOfFailureJobs);
    }

    private record JobStatusCounter(long nextNumberOfSuccessJobs, long nextNumberOfFailureJobs) {
    }
}
