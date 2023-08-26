package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.*;
import com.hoatv.action.manager.collections.ActionStatisticsDocument.ActionStatisticsDocumentBuilder;
import com.hoatv.action.manager.document.transformers.ActionTransformer;
import com.hoatv.action.manager.document.transformers.JobTransformer;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.ActionStatisticsDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.fwk.common.services.BiCheckedConsumer;
import com.hoatv.fwk.common.services.CheckedFunction;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import com.hoatv.fwk.common.ultilities.GenericKeyedLock;
import com.hoatv.fwk.common.ultilities.Pair;
import com.hoatv.metric.mgmt.annotations.Metric;
import com.hoatv.metric.mgmt.annotations.MetricProvider;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.ServletOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
        LOGGER.info("Init the scheduled jobs per actions on startup");
        long numberOfActions = actionDocumentRepository.count();
        actionStatistics.numberOfActions.set(numberOfActions);
        LOGGER.info("Number of persisted actions: {}", numberOfActions);
        LOGGER.info("Looking for the active actions");
        List<ActionDocument> actionDocumentList = actionDocumentRepository.findByActionStatus(ActionStatus.ACTIVE);
        Set<String> actionIdList = actionDocumentList.stream().map(ActionDocument::getHash).collect(Collectors.toSet());
        LOGGER.info("Number of active actions: {}", actionIdList.size());

        LOGGER.info("Get enabled schedule jobs from active actions: {}", actionIdList);
        Map<String, Map<String, String>> actionJobMapping = jobManagerService.getEnabledScheduleJobsGroupByActionId(actionIdList);

        Set<String> activeScheduleActionIds = actionJobMapping.keySet();
        List<ActionDocument> activeScheduleActions = actionDocumentList.stream()
                .filter(p -> activeScheduleActionIds.contains(p.getHash()))
                .collect(Collectors.toList());
        LOGGER.info("Initial schedule jobs for actions {}", activeScheduleActionIds);

        List<ActionStatisticsDocument> actionStatics = actionStatisticsDocumentRepository.findByActionIdIn(activeScheduleActionIds);
        Map<String, List<ActionStatisticsDocument>> actionStatisticMapping = actionStatics.stream()
                .collect(Collectors.groupingBy(ActionStatisticsDocument::getActionId));

        CheckedFunction<ActionDocument, ActionExecutionContext> executionContextFunction =
                getActionExecutionContext(actionJobMapping, actionStatisticMapping);

        List<ActionExecutionContext> executionContexts = activeScheduleActions.stream()
                .map(executionContextFunction)
                .filter(Objects::nonNull)
                .toList();
        jobManagerService.processBulkJobs(executionContexts);
    }

    @Override
    @LoggingMonitor
    public Page<ActionOverviewDTO> search(String search, Pageable pageable) {
        Page<ActionDocument> actionDocuments = actionDocumentRepository.findActionByName(search, pageable);
        return getActionOverviewDTOS(actionDocuments);
    }

    @Override
    @LoggingMonitor
    public Page<ActionOverviewDTO> getActions(List<ActionStatus> filterStatuses, Pageable pageable) {
        LOGGER.info("Get actions from statuses: {}", filterStatuses);
        Page<ActionDocument> actionDocuments = actionDocumentRepository.findByActionStatusIn(filterStatuses, pageable);
        return getActionOverviewDTOS(actionDocuments);
    }

    @Override
    @LoggingMonitor
    public Optional<ActionDefinitionDTO> getActionById(String hash) {
        return actionDocumentRepository.findById(hash)
                .map(ActionTransformer::toActionDefinition);
    }

    @Override
    public Optional<ActionDefinitionDTO> setFavorite(String hash, boolean isFavorite) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(hash);
        if (actionDocumentOptional.isEmpty()) {
            return Optional.empty();
        }
        ActionDocument actionDocument = actionDocumentOptional.get();
        actionDocument.setFavorite(isFavorite);
        ActionDocument document = actionDocumentRepository.save(actionDocument);
        return Optional.of(ActionTransformer.toActionDefinition(document));
    }

    @Override
    public void dryRun(ActionDefinitionDTO actionDefinition) {
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
    public boolean replay(String actionId) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContextForReplay(actionId);
        jobManagerService.processBulkJobs(actionExecutionContext);
        actionStatistics.numberOfReplayActions.incrementAndGet();
        return true;
    }

    @Override
    @LoggingMonitor
    public void delete(String hash) {
        actionDocumentRepository.deleteById(hash);
        actionStatisticsDocumentRepository.deleteByActionId(hash);
        jobManagerService.deleteJobsByActionId(hash);
        actionStatistics.numberOfActions.decrementAndGet();
    }

    @Override
    @LoggingMonitor
    public void archive(String actionId) {
        ActionDocument actionDocument = getActionDocument(actionId);
        List<JobDocumentRepository.JobIdImmutable> immutableJobIds = jobManagerService.getJobIdsByAction(actionId);
        immutableJobIds.stream().map(p -> p.getHash()).forEach(jobManagerService::pause);
        actionDocument.setActionStatus(ActionStatus.MOVE_TO_TRASH);
        actionDocumentRepository.save(actionDocument);
    }

    @Override
    public void restore(String actionId) {
        ActionDocument actionDocument = getActionDocument(actionId);
        List<JobDocumentRepository.JobIdImmutable> immutableJobIds = jobManagerService.getJobIdsByAction(actionId);
        immutableJobIds.stream().map(p -> p.getHash()).forEach(this::resume);

        actionDocument.setActionStatus(ActionStatus.ACTIVE);
        actionDocumentRepository.save(actionDocument);
    }

    @Override
    public void resume(String jobHash) {
        JobDocument jobDocument = jobManagerService.getJobDocument(jobHash);
        if (!jobDocument.isScheduled()) {
            LOGGER.warn("Skip resume for job {}, resume mechanisms only support for scheduled jobs", jobDocument.getJobName());
            return;
        }
        jobDocument.setJobStatus(JobStatus.ACTIVE.name());
        JobResultDocument jobResultDocument = jobManagerService.getJobResultDocumentByJobId(jobHash);
        ActionStatisticsDocument statisticsDocument = actionStatisticsDocumentRepository.findByActionId(jobDocument.getActionId());
        jobManagerService.update(jobDocument);
        jobManagerService.processJob(jobDocument, jobResultDocument, onCompletedJobCallback(statisticsDocument), false);
    }

    @Override
    public Pair<String, byte[]> export(String actionId, ServletOutputStream responseOutputStream) {
        ActionDocument actionDocument = getActionDocument(actionId);
        LOGGER.info("[{}] Looking for job documents", actionDocument.getActionName());
        List<JobDocument> jobDocumentsByAction = jobManagerService.getJobDocumentsByAction(actionId);
        List<JobDefinitionDTO> jobDefinitionDTOs = jobDocumentsByAction.stream()
                .map(JobTransformer::toJobDefinition)
                .collect(Collectors.toList());

        ActionDefinitionDTO actionDefinition = ActionTransformer.toActionDefinition(actionDocument);
        actionDefinition.setJobs(jobDefinitionDTOs);

        CheckedFunction<ActionDefinitionDTO, byte[]> zipActionFunction = zipActionDefinition();
        return Pair.of(actionDocument.getActionName(), zipActionFunction.apply(actionDefinition));
    }

    private static CheckedFunction<ActionDefinitionDTO, byte[]> zipActionDefinition() {
        ObjectMapper objectMapper = new ObjectMapper();

        return actionDefinition -> {
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            LOGGER.info("[{}] Put content of action to zip file", actionDefinition.getActionName());
            ZipOutputStream zipOutputStream = new ZipOutputStream(byteArrayOutputStream);
            ZipEntry entry = new ZipEntry("content.json");
            zipOutputStream.putNextEntry(entry);
            String actionAsString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(actionDefinition);
            zipOutputStream.write(actionAsString.getBytes(StandardCharsets.UTF_8));
            zipOutputStream.closeEntry();
            zipOutputStream.close();
            return byteArrayOutputStream.toByteArray();
        };
    }

    private ActionDocument getActionDocument(String actionId) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(actionId);
        ActionDocument actionDocument = actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + actionId));
        return actionDocument;
    }

    private CheckedFunction<ActionDocument, ActionExecutionContext> getActionExecutionContext(
            Map<String, Map<String, String>> actionJobMapping,
            Map<String, List<ActionStatisticsDocument>> actionStatisticMapping) {
        return actionDocument -> {
            try {
                LOGGER.info("Initial execution context for action {}", actionDocument.getActionName());
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
                    .actionStatus(actionDocument.getActionStatus().name())
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
        ActionDocument actionDocument = getActionDocument(actionId);
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
        ActionDocument actionDocument = getActionDocument(actionId);

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
        ActionDocument actionDocument = actionDocumentRepository.save(ActionTransformer.fromActionDefinition(actionDefinition));
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
