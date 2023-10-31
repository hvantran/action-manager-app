package com.hoatv.action.manager.services;

import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository.JobTypeImmutable;
import com.hoatv.fwk.common.services.CheckedConsumer;
import com.hoatv.fwk.common.ultilities.GenericKeyedLock;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;


@Component
public class ActionStatsManager {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActionStatsManager.class);
    private final GenericKeyedLock<String> actionKeyedLockManager = new GenericKeyedLock<>();
    private final Map<String, ActionStats> actionStatisticMap = new HashMap<>();

    public void initStats(String... actionIds) {
        Arrays.asList(actionIds).forEach((actionId) -> {
            ActionStats actionStats = ActionStats.builder()
                    .numberOfJobs(new AtomicLong(0))
                    .numberOfFailureJobs(new AtomicLong(0))
                    .numberOfSuccessJobs(new AtomicLong(0))
                    .numberOfScheduleJobs(new AtomicLong(0))
                    .build();
            actionStatisticMap.put(actionId, actionStats);
        });
    }

    public ActionStats getActionStats(String actionId) {
        return actionStatisticMap.get(actionId);
    }

    public long getNumberOfActions() {
        return actionStatisticMap.keySet().size();
    }

    public void increaseNumberOfJobs(String actionId, long numberOfJobs) {
        Consumer<ActionStats> actionStatsConsumer = actionStats ->
            actionStats.getNumberOfJobs().addAndGet(numberOfJobs);
        processStatOnActionLock(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfSuccessJob(String actionId) {
        Consumer<ActionStats> actionStatsConsumer = actionStats ->
                actionStats.getNumberOfSuccessJobs().incrementAndGet();
        processStatOnActionLock(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfFailureJob(String actionId) {
        Consumer<ActionStats> actionStatsConsumer = actionStats ->
                actionStats.getNumberOfFailureJobs().incrementAndGet();
        processStatOnActionLock(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfScheduleJob(String actionId) {
        Consumer<ActionStats> actionStatsConsumer = actionStats ->
                actionStats.getNumberOfScheduleJobs().incrementAndGet();
        processStatOnActionLock(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfScheduleJob(String actionId, long delta) {
        Consumer<ActionStats> actionStatsConsumer = actionStats ->
                actionStats.getNumberOfScheduleJobs().addAndGet(delta);
        processStatOnActionLock(actionId, actionStatsConsumer);
    }

    private void processStatOnActionLock(String actionId, Consumer<ActionStats> actionStatisticConsumer) {
        CheckedConsumer<String> checkedConsumer = (documentHash) -> {
            if (actionKeyedLockManager.tryAcquire(documentHash, 5000, TimeUnit.MILLISECONDS)) {
                ActionStats actionStats = actionStatisticMap.get(documentHash);
                actionStatisticConsumer.accept(actionStats);
                return;
            }
            LOGGER.error("Cannot get lock on completed job callback function");
        };
        checkedConsumer.accept(actionId);
    }


    @Builder
    @Getter
    @Setter
    public static class ActionStats {
        private AtomicLong numberOfJobs;
        private AtomicLong numberOfFailureJobs;
        private AtomicLong numberOfSuccessJobs;
        private AtomicLong numberOfScheduleJobs;
    }
}
