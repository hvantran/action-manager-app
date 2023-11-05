package com.hoatv.action.manager.services;

import com.hoatv.fwk.common.constants.MetricProviders;
import com.hoatv.metric.mgmt.annotations.Metric;
import com.hoatv.metric.mgmt.annotations.MetricProvider;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;


@Component
@MetricProvider(application = MetricProviders.OTHER_APPLICATION, category = "action-manager-stats-data")
public class ActionManagerStatistics {

    private final Map<String, ActionStatistics> actionStatisticsMapping = new HashMap<>();

    @Metric(name = "action-manager-number-of-actions")
    public long getNumberOfActions() {
        return actionStatisticsMapping.keySet().size();
    }

    public void initActionStatistics(Set<String> actionIds) {
        actionIds.forEach(actionId -> {
            ActionStatistics actionStatistics = ActionStatistics.builder()
                    .numberOfJobs(new AtomicLong(0))
                    .numberOfFailureJobs(new AtomicLong(0))
                    .numberOfSuccessJobs(new AtomicLong(0))
                    .numberOfScheduleJobs(new AtomicLong(0))
                    .numberOfPendingJobs(new AtomicLong(0))
                    .build();
            actionStatisticsMapping.put(actionId, actionStatistics);
        });
    }

    public void initActionStatistics(String actionId, ActionStatistics actionStatistics) {
        actionStatisticsMapping.put(actionId, actionStatistics);
    }

    public void removeActionStats(String actionId) {
        actionStatisticsMapping.remove(actionId);
    }

    public ActionStatistics getActionStats(String actionId) {
        return actionStatisticsMapping.get(actionId);
    }

    public void increaseNumberOfJobs(String actionId, long numberOfJobs) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
            actionStatistics.getNumberOfJobs().addAndGet(numberOfJobs);
        processStats(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfSuccessJob(String actionId) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfSuccessJobs().incrementAndGet();
        processStats(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfFailureJob(String actionId) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfFailureJobs().incrementAndGet();
        processStats(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfPendingJob(String actionId, long delta) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfPendingJobs().addAndGet(delta);
        processStats(actionId, actionStatsConsumer);
    }

    public void increaseNumberOfScheduleJob(String actionId, long delta) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfScheduleJobs().addAndGet(delta);
        processStats(actionId, actionStatsConsumer);
    }

    public void decreaseNumberOfFailureJob(String actionId) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfFailureJobs().decrementAndGet();
        processStats(actionId, actionStatsConsumer);
    }

    public void decreaseNumberOfSuccessJob(String actionId) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfSuccessJobs().decrementAndGet();
        processStats(actionId, actionStatsConsumer);
    }

    public void decreaseNumberOfPendingJob(String actionId) {
        Consumer<ActionStatistics> actionStatsConsumer = actionStatistics ->
                actionStatistics.getNumberOfPendingJobs().decrementAndGet();
        processStats(actionId, actionStatsConsumer);
    }

    private void processStats(String actionId, Consumer<ActionStatistics> actionStatisticConsumer) {
        ActionStatistics actionStatistics = actionStatisticsMapping.get(actionId);
        actionStatisticConsumer.accept(actionStatistics);
    }


    @Builder
    @Getter
    @Setter
    public static class ActionStatistics {
        private AtomicLong numberOfJobs;
        private AtomicLong numberOfFailureJobs;
        private AtomicLong numberOfSuccessJobs;
        private AtomicLong numberOfScheduleJobs;
        private AtomicLong numberOfPendingJobs;
    }
}
