package com.hoatv.action.manager.utils;

import com.hoatv.action.manager.collections.JobExecutionStatus;
import com.hoatv.action.manager.services.ActionManagerStatistics;
import com.hoatv.fwk.common.services.BiCheckedConsumer;

import java.util.HashMap;
import java.util.Map;
import java.util.function.BiPredicate;

public class ActionManagerConstants {
    public static final Map<BiPredicate<JobExecutionStatus, JobExecutionStatus>, BiCheckedConsumer<ActionManagerStatistics, String>> JOB_STATUS_COUNTER_PROCESSOR = new HashMap<>();

    static {
        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == next, (actionManagerStatistics, actionId) -> {
        });
        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == null && next == JobExecutionStatus.SUCCESS, ActionManagerStatistics::increaseNumberOfSuccessJob);
        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == null && next == JobExecutionStatus.FAILURE, ActionManagerStatistics::increaseNumberOfFailureJob);
        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == JobExecutionStatus.FAILURE && next == JobExecutionStatus.SUCCESS, (actionManagerStatistics, actionId) -> {
            actionManagerStatistics.increaseNumberOfSuccessJob(actionId);
            actionManagerStatistics.decreaseNumberOfFailureJob(actionId);
        });

        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == JobExecutionStatus.SUCCESS && next == JobExecutionStatus.FAILURE, (actionManagerStatistics, actionId) -> {
            actionManagerStatistics.decreaseNumberOfSuccessJob(actionId);
            actionManagerStatistics.increaseNumberOfFailureJob(actionId);
        });

        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == JobExecutionStatus.PENDING && next == JobExecutionStatus.FAILURE, (actionManagerStatistics, actionId) -> {
            actionManagerStatistics.decreaseNumberOfPendingJob(actionId);
            actionManagerStatistics.increaseNumberOfFailureJob(actionId);
        });
        JOB_STATUS_COUNTER_PROCESSOR.put((prev, next) -> prev == JobExecutionStatus.PENDING && next == JobExecutionStatus.SUCCESS, (actionManagerStatistics, actionId) -> {
            actionManagerStatistics.decreaseNumberOfPendingJob(actionId);
            actionManagerStatistics.increaseNumberOfSuccessJob(actionId);
        });
    }

    private ActionManagerConstants() {
    }
}
