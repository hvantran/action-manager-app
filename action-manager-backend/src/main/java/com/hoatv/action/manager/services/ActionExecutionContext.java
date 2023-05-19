package com.hoatv.action.manager.services;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatisticsDocument;
import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.dtos.JobStatus;
import com.hoatv.fwk.common.ultilities.Pair;
import java.util.Map;
import java.util.function.BiConsumer;
import lombok.*;

import java.util.List;
import java.util.function.Consumer;

@Builder
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ActionExecutionContext {

    private ActionDocument actionDocument;

    private ActionStatisticsDocument actionStatisticsDocument;

    private Map<String, String> jobDocumentPairs;

    private BiConsumer<JobStatus, JobStatus> onCompletedJobCallback;

    private boolean isRelayAction;
}
