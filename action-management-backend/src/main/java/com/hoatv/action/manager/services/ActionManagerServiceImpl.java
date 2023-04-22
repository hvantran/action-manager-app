package com.hoatv.action.manager.services;

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
import com.hoatv.action.manager.dtos.JobStatus;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.ActionStatisticsDocumentRepository;
import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.fwk.common.services.CheckedConsumer;
import com.hoatv.fwk.common.services.CheckedFunction;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import com.hoatv.fwk.common.ultilities.Pair;
import com.hoatv.metric.mgmt.annotations.Metric;
import com.hoatv.metric.mgmt.annotations.MetricProvider;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@MetricProvider(application = MetricProviders.OTHER_APPLICATION, category = "action-manager-stats-data")
public class ActionManagerServiceImpl implements ActionManagerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActionManagerServiceImpl.class);

    private final ActionDocumentRepository actionDocumentRepository;

    private final ActionStatisticsDocumentRepository actionStatisticsDocumentRepository;

    private final JobManagerService jobManagerService;

    private final ActionStatistics actionStatistics;

    @Autowired
    public ActionManagerServiceImpl(ActionDocumentRepository actionDocumentRepository,
                                    JobManagerService jobManagerService,
                                    ActionStatisticsDocumentRepository actionStatisticsDocumentRepository)  {
        this.actionDocumentRepository = actionDocumentRepository;
        this.jobManagerService = jobManagerService;
        this.actionStatistics = new ActionStatistics();
        this.actionStatisticsDocumentRepository = actionStatisticsDocumentRepository;
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

        List<Pair<JobDocument, JobResultDocument>> scheduleJobPairs = jobManagerService.getScheduleJobPairs();
        Map<String, List<Pair<JobDocument, JobResultDocument>>> actionJobMapping = scheduleJobPairs.stream()
                .collect(Collectors.groupingBy(p -> p.getKey().getActionId()));
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
            Map<String, List<Pair<JobDocument, JobResultDocument>>> actionJobMapping,
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
    @LoggingMonitor
    public String processAction(ActionDefinitionDTO actionDefinition) {
        ActionExecutionContext actionExecutionContext = getActionExecutionContext(actionDefinition);
        jobManagerService.processBulkJobs(actionExecutionContext);
        actionStatistics.numberOfActions.incrementAndGet();
        return actionExecutionContext.getActionDocument().getHash();
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
            long numberOfScheduleJobs = numberOfJobs - numberOfFailureJobs - numberOfSuccessJobs;
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

    private ActionExecutionContext getActionExecutionContextForReplay(String actionId) {
        Optional<ActionDocument> actionDocumentOptional = actionDocumentRepository.findById(actionId);
        ActionDocument actionDocument = actionDocumentOptional
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + actionId));
        ActionStatisticsDocument actionStatisticsDocument = actionStatisticsDocumentRepository.findByActionId(actionId);
        List<Pair<JobDocument, JobResultDocument>> jobDocumentPairs = jobManagerService.getOneTimeJobsFromAction(actionId);
        CheckedConsumer<JobStatus> onCompletedJobCallback = onCompletedJobCallback(actionStatisticsDocument);

        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .actionStatisticsDocument(actionStatisticsDocument)
                .jobDocumentPairs(jobDocumentPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
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
        CheckedFunction<JobDefinitionDTO, Pair<JobDocument, JobResultDocument>> initialJobFunction =
                jobDefinitionDTO -> jobManagerService.initialJobs(jobDefinitionDTO, actionDocument.getHash());
        List<Pair<JobDocument, JobResultDocument>> jobDocumentPairs = definitionJobs.stream()
                .map(initialJobFunction)
                .toList();
        LOGGER.info("ActionExecutionContext: jobDocumentPairs - {}", jobDocumentPairs);

        CheckedConsumer<JobStatus> onCompletedJobCallback = onCompletedJobCallback(actionStatisticsDocument);

        return ActionExecutionContext.builder()
                .actionDocument(actionDocument)
                .actionStatisticsDocument(actionStatisticsDocument)
                .jobDocumentPairs(jobDocumentPairs)
                .onCompletedJobCallback(onCompletedJobCallback)
                .build();
    }

    private CheckedConsumer<JobStatus> onCompletedJobCallback(ActionStatisticsDocument actionStatisticsDocument) {
        return jobStatus -> {

            if (Objects.requireNonNull(jobStatus) == JobStatus.SUCCESS) {
                long numberOfSuccessJobs = actionStatisticsDocument.getNumberOfSuccessJobs();
                actionStatisticsDocument.setNumberOfSuccessJobs(numberOfSuccessJobs + 1);
            } else {
                long numberOfFailureJobs = actionStatisticsDocument.getNumberOfFailureJobs();
                actionStatisticsDocument.setNumberOfFailureJobs(numberOfFailureJobs + 1);
            }
            long currentProcessedJobs =
                    actionStatisticsDocument.getNumberOfFailureJobs() + actionStatisticsDocument.getNumberOfSuccessJobs();
            actionStatisticsDocument.setPercentCompleted((double) currentProcessedJobs * 100 / actionStatisticsDocument.getNumberOfJobs());
            actionStatisticsDocumentRepository.save(actionStatisticsDocument);
        };
    }
}
