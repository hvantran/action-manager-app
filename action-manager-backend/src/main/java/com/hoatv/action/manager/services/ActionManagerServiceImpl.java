package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.*;
import com.hoatv.action.manager.document.transformers.ActionTransformer;
import com.hoatv.action.manager.document.transformers.JobTransformer;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.fwk.common.exceptions.InvalidArgumentException;
import com.hoatv.fwk.common.services.BiCheckedConsumer;
import com.hoatv.fwk.common.services.CheckedFunction;
import com.hoatv.fwk.common.ultilities.ObjectUtils;
import com.hoatv.fwk.common.ultilities.Pair;
import com.hoatv.fwk.common.ultilities.ZipFileUtils;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.zip.ZipInputStream;

@Service
@MetricProvider(application = MetricProviders.OTHER_APPLICATION, category = "action-manager-stats-data")
public class ActionManagerServiceImpl implements ActionManagerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActionManagerServiceImpl.class);

    public static final String ACTION_CONTENT_FILE = "content.json";

    private static final List<ActionStatus> VALID_ACTION_STATUS_TO_RUN = List.of(ActionStatus.ACTIVE);

    private final ActionDocumentRepository actionDocumentRepository;

    private final JobDocumentRepository jobDocumentRepository;

    private final JobManagerService jobManagerService;

    private final AtomicLong numberOfReplayActions;

    private final ActionStatsManager actionStatsManager;

    @Autowired
    public ActionManagerServiceImpl(ActionDocumentRepository actionDocumentRepository,
                                    JobManagerService jobManagerService,
                                    ActionStatsManager actionStatsManager) {

        this.actionDocumentRepository = actionDocumentRepository;
        this.jobManagerService = jobManagerService;
        this.actionStatsManager = actionStatsManager;
        this.numberOfReplayActions = new AtomicLong(0);
    }

    @Metric(name = "action-manager-number-of-actions")
    public long getNumberOfActions() {
        return actionStatsManager.getNumberOfActions();
    }

    @Metric(name = "action-manager-number-of-replay-actions")
    public long getNumberOfReplayActions() {
        return numberOfReplayActions.get();
    }


    @PostConstruct
    public void initialize() {
        Map<String, JobDocumentRepository.JobTypeImmutable> actionJobMapping = jobDocumentRepository.groupByActionId();
        actionStatsManager.
    }

    @PostConstruct
    public void initScheduleJobsOnStartup() {
        LOGGER.info("Init the scheduled jobs per actions on startup");
        List<ActionDocument> actionDocumentList = actionDocumentRepository.findByActionStatus(ActionStatus.ACTIVE);
        Set<String> actionIdList = actionDocumentList.stream().map(ActionDocument::getHash).collect(Collectors.toSet());
        LOGGER.info("Number of active actions: {}", actionIdList.size());

        Map<String, Map<String, String>> actionJobMapping = jobManagerService.getEnabledScheduleJobsGroupByActionId(actionIdList);
        Set<String> activeScheduleActionIds = actionJobMapping.keySet();
        List<ActionDocument> activeScheduleActions = actionDocumentList.stream()
                .filter(p -> activeScheduleActionIds.contains(p.getHash()))
                .toList();
        LOGGER.info("Initial schedule jobs for actions {}", activeScheduleActionIds);

        CheckedFunction<ActionDocument, ActionExecutionContext> executionContextFunction =
                getActionExecutionContext(actionJobMapping);

        List<ActionExecutionContext> executionContexts = activeScheduleActions.stream()
                .map(executionContextFunction)
                .filter(Objects::nonNull)
                .toList();
        jobManagerService.processBulkJobs(executionContexts);
    }

    @Override
    @LoggingMonitor(description = "Search actions with {argument0}")
    public Page<ActionOverviewDTO> search(String search, Pageable pageable) {
        Page<ActionDocument> actionDocuments = actionDocumentRepository.findActionByName(search, pageable);
        return getActionOverviewDTOs(actionDocuments);
    }

    @Override
    @LoggingMonitor(description = "Get action by statuses: {argument0}, page info: ${argument1}")
    public Page<ActionOverviewDTO> getActions(List<ActionStatus> filterStatuses, Pageable pageable) {
        LOGGER.info("Get actions from statuses: {}", filterStatuses);
        Page<ActionDocument> actionDocuments = actionDocumentRepository.findByActionStatusIn(filterStatuses, pageable);
        return getActionOverviewDTOs(actionDocuments);
    }

    @Override
    @LoggingMonitor(description = "Get action by id {argument0}")
    public Optional<ActionDefinitionDTO> getActionById(String hash) {
        return actionDocumentRepository.findById(hash)
                .map(ActionTransformer::toActionDefinition);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Set favorite value: {argument1} for action {argument0}")
    public ActionDefinitionDTO setFavorite(String hash, boolean isFavorite) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(hash);
        ActionDocument actionDocument = actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));

        actionDocument.setFavorite(isFavorite);
        ActionDocument document = actionDocumentRepository.save(actionDocument);
        return ActionTransformer.toActionDefinition(document);
    }

    @Override
    @LoggingMonitor(description = "Dry dun action: {argument0.getActionName()}")
    public void dryRun(ActionDefinitionDTO actionDefinition) {
        actionDefinition.getJobs().forEach(jobManagerService::processNonePersistenceJob);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Process action: {argument0.getActionName()}")
    public String create(ActionDefinitionDTO actionDefinition) {
        ActionDocument actionDocument = createActionDocument(actionDefinition);
        ActionExecutionContext actionExecutionContext = getActionExecutionContext(actionDefinition, actionDocument);

        if (VALID_ACTION_STATUS_TO_RUN.contains(actionDocument.getActionStatus())) {
            jobManagerService.processBulkJobs(actionExecutionContext);
        } else {
            LOGGER.warn("The jobs under action {} is not run immediately " +
                            "because action status is {}, " +
                            "valid statuses to run {}",
                    actionDocument.getActionName(),
                    actionDocument.getActionStatus(),
                    VALID_ACTION_STATUS_TO_RUN);
        }

        List<JobDefinitionDTO> relatedJobs = actionDefinition.getJobs();
        long numberOfScheduleJobs = relatedJobs.stream().filter(JobDefinitionDTO::isScheduled).count();
        String actionDocumentHash = actionDocument.getHash();
        actionStatsManager.initStats(actionDocumentHash);
        actionStatsManager.increaseNumberOfScheduleJob(actionDocumentHash, numberOfScheduleJobs);
        actionStatsManager.increaseNumberOfJobs(actionDocumentHash, relatedJobs.size());
        return actionDefinition.getActionName();
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Update action: {argument1.getActionName()}")
    public void update(String actionId, ActionDefinitionDTO actionDefinitionDTO) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(actionId);
        ActionDocument actionDocument = actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + actionId));
        actionDocument.setConfigurations(actionDefinitionDTO.getConfigurations());
        actionDocument.setActionStatus(ActionStatus.valueOf(actionDefinitionDTO.getActionStatus()));
        actionDocumentRepository.save(actionDocument);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Create {argument0.getActionName()} action from action definition")
    public ActionDocument createActionDocument(ActionDefinitionDTO actionDefinition) {
        String actionName = actionDefinition.getActionName();
        List<ActionDocument> persistedActions = actionDocumentRepository.findActionByName(actionName);
        Supplier<InvalidArgumentException> exceptionSupplier = () -> new InvalidArgumentException("Action " + actionName + " already exists");
        ObjectUtils.checkThenThrow(!persistedActions.isEmpty(), exceptionSupplier);
        return actionDocumentRepository.save(ActionTransformer.fromActionDefinition(actionDefinition));
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Add new job to action {argument0}")
    public String addJobsToAction(String actionId, List<JobDefinitionDTO> jobDefinitionDTOs) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContextForNewJobs(actionId, jobDefinitionDTOs);
        jobManagerService.processBulkJobs(actionExecutionContext);
        this.numberOfActions.incrementAndGet();
        return actionId;
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Replay action {argument0}")
    public boolean replay(String actionId) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContextForReplay(actionId);
        jobManagerService.processBulkJobs(actionExecutionContext);
        this.numberOfReplayActions.incrementAndGet();
        return true;
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Delete action {argument0}")
    public void delete(String actionId) {
        actionDocumentRepository.deleteById(actionId);
        jobManagerService.deleteJobsByActionId(actionId);
        this.numberOfActions.decrementAndGet();
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Archive action by id: {argument0}")
    public void archive(String actionId) {
        ActionDocument actionDocument = createActionDocument(actionId);
        List<JobDocument> jobDocuments = jobManagerService.getJobDocumentsByAction(actionId);
        jobDocuments.forEach(jobDocument -> jobDocument.setJobStatus(JobStatus.ARCHIVED));
        jobManagerService.updateBulks(jobDocuments);

        jobDocuments.stream().map(JobDocument::getHash).forEach(jobManagerService::pause);

        actionDocument.setActionStatus(ActionStatus.ARCHIVED);
        actionDocumentRepository.save(actionDocument);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Restore action {argument0}")
    public void restore(String actionId) {
        ActionDocument actionDocument = createActionDocument(actionId);
        List<JobDocumentRepository.JobIdImmutable> immutableJobIds = jobManagerService.getJobIdsByAction(actionId);
        immutableJobIds.stream().map(JobDocumentRepository.JobIdImmutable::getHash).forEach(this::resume);

        actionDocument.setActionStatus(ActionStatus.ACTIVE);
        actionDocumentRepository.save(actionDocument);
    }

    @Override
    @Transactional
    @LoggingMonitor(description = "Resume job {argument0}")
    public void resume(String jobHash) {
        JobDocument jobDocument = jobManagerService.getJobDocument(jobHash);
        if (!jobDocument.isScheduled()) {
            LOGGER.warn("Skip resume for job {}, resume mechanisms only support for scheduled jobs", jobDocument.getJobName());
            return;
        }
        jobDocument.setJobStatus(JobStatus.ACTIVE);
        JobResultDocument jobResultDocument = jobManagerService.getJobResultDocumentByJobId(jobHash);
        jobManagerService.update(jobDocument);
        jobManagerService.processJob(jobDocument, jobResultDocument, onCompletedJobCallback(), false);
    }

    @Override
    @LoggingMonitor(description = "Exporting action: {argument0} to zip file")
    public Pair<String, byte[]> export(String actionId, ServletOutputStream responseOutputStream) {
        ActionDocument actionDocument = createActionDocument(actionId);
        LOGGER.info("Looking for job documents from {} action", actionDocument.getActionName());
        List<JobDocument> jobDocumentsByAction = jobManagerService.getJobDocumentsByAction(actionId);
        List<JobDefinitionDTO> jobDefinitionDTOs = jobDocumentsByAction.stream()
                .map(JobTransformer::toJobDefinition)
                .toList();

        ActionDefinitionDTO actionDefinition = ActionTransformer.toActionDefinition(actionDocument);
        actionDefinition.setJobs(jobDefinitionDTOs);

        CheckedFunction<ActionDefinitionDTO, byte[]> zipActionFunction = zipActionDefinition();
        return Pair.of(actionDocument.getActionName(), zipActionFunction.apply(actionDefinition));
    }

    @Override
    @LoggingMonitor(description = "Import new action from file")
    public String importAction(MultipartFile multipartFile) throws IOException {
        ZipInputStream zipInputStream = new ZipInputStream(multipartFile.getInputStream());
        List<Path> actionFilePaths = ZipFileUtils.getFilesFromZip(zipInputStream);
        ObjectMapper objectMapper = new ObjectMapper();
        CheckedFunction<Path, String> pathConsumer = actionFilePath -> {
            ActionDefinitionDTO actionDefinitionDTO =
                    objectMapper.readValue(actionFilePath.toFile(), ActionDefinitionDTO.class);
            return create(actionDefinitionDTO);
        };
        List<String> actionNames = actionFilePaths.stream().map(pathConsumer).toList();
        return actionNames.get(0);
    }

    private static CheckedFunction<ActionDefinitionDTO, byte[]> zipActionDefinition() {
        ObjectMapper objectMapper = new ObjectMapper();

        return actionDefinition -> {
            LOGGER.info("Put {} action content to {}", actionDefinition.getActionName(), ACTION_CONTENT_FILE);
            String actionAsString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(actionDefinition);
            return ZipFileUtils.zipFileContents(Map.of(ACTION_CONTENT_FILE, actionAsString));
        };
    }

    private ActionDocument createActionDocument(String actionId) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(actionId);
        return actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + actionId));
    }

    private CheckedFunction<ActionDocument, ActionExecutionContext> getActionExecutionContext(
            Map<String, Map<String, String>> actionJobMapping) {
        return actionDocument -> {
            try {
                LOGGER.info("Initial execution context for action {}", actionDocument.getActionName());
                return ActionExecutionContext.builder()
                        .actionDocument(actionDocument)
                        .jobDocumentPairs(actionJobMapping.get(actionDocument.getHash()))
                        .onCompletedJobCallback(onCompletedJobCallback())
                        .build();
            } catch (Exception exception) {
                LOGGER.info("Cannot get action statistic from action id {}", actionDocument.getHash(), exception);
                return null;
            }
        };
    }

    private Page<ActionOverviewDTO> getActionOverviewDTOs(Page<ActionDocument> actionDocuments) {
        return actionDocuments.map(actionDocument -> {
            String actionId = actionDocument.getHash();
            ActionStatsManager.ActionStats actionStats = actionStatsManager.getActionStats(actionId);
            long numberOfJobs = actionStats.getNumberOfJobs().get();
            long numberOfFailureJobs = actionStats.getNumberOfFailureJobs().get();
            long numberOfSuccessJobs = actionStats.getNumberOfSuccessJobs().get();
            long numberOfScheduleJobs = actionStats.getNumberOfScheduleJobs().get();

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
        ActionDocument actionDocument = createActionDocument(actionId);
        Map<String, String> jobDocumentPairs = getJobDocumentPairs(jobDefinitionDTOs, actionDocument);
        LOGGER.info("ActionExecutionContext: jobDocumentPairs - {}", jobDocumentPairs);

        long scheduledJobIncreases = jobDefinitionDTOs.stream().filter(JobDefinitionDTO::isScheduled).count();
        actionStatsManager.increaseNumberOfScheduleJob(actionId, scheduledJobIncreases);
        actionStatsManager.increaseNumberOfJobs(actionId, jobDefinitionDTOs.size());

        BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback = onCompletedJobCallback();
        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
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
        ActionDocument actionDocument = createActionDocument(actionId);

        Map<String, String> jobDocumentPairs = jobManagerService.getEnabledOnetimeJobs(actionId);
        Map<String, String> scheduledJobDocumentPairs = jobManagerService.getEnabledScheduledJobs(actionId);

        BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback = onCompletedJobCallback();
        Map<String, String> jobDocumentProcessPairs = new HashMap<>(jobDocumentPairs);
        jobDocumentProcessPairs.putAll(scheduledJobDocumentPairs);
        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .jobDocumentPairs(jobDocumentProcessPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
                .isRelayAction(true)
                .build();
    }

    private ActionExecutionContext getActionExecutionContext(ActionDefinitionDTO actionDefinition, ActionDocument actionDocument) {
        List<JobDefinitionDTO> definitionJobs = actionDefinition.getJobs();
        Map<String, String> jobDocumentPairs = getJobDocumentPairs(definitionJobs, actionDocument);
        LOGGER.info("ActionExecutionContext: jobDocumentPairs - {}", jobDocumentPairs);

        BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback = onCompletedJobCallback();

        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .jobDocumentPairs(jobDocumentPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
                .build();
    }


    private BiCheckedConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback() {
        return (prevJobStatus, currentJobStatus) -> {
            /*LOGGER.info("Prev status: {} -> Next status: {}", prevJobStatus, currentJobStatus);
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
            }*/
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
