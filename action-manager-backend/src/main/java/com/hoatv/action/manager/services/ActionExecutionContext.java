package com.hoatv.action.manager.services;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatisticsDocument;
import com.hoatv.action.manager.collections.JobExecutionStatus;

import java.util.Map;
import java.util.function.BiConsumer;
import lombok.*;

@Builder
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ActionExecutionContext {

    private ActionDocument actionDocument;

    private ActionStatisticsDocument actionStatisticsDocument;

    private Map<String, String> jobDocumentPairs;

    private BiConsumer<JobExecutionStatus, JobExecutionStatus> onCompletedJobCallback;

    private boolean isRelayAction;
}
