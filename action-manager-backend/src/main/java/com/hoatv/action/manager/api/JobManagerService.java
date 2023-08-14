package com.hoatv.action.manager.api;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.collections.JobExecutionStatus;
import com.hoatv.action.manager.services.ActionExecutionContext;
import com.hoatv.fwk.common.ultilities.Pair;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

public interface JobManagerService {

    JobResultDocument getJobResultDocumentByJobId(String jobHash);

    void pause(String jobHash);

    void deleteJobsByActionId(String actionId);

    void processBulkJobs(ActionExecutionContext actionExecutionContext);

    void processBulkJobs(List<ActionExecutionContext> actionExecutionContexts);

    Page<JobOverviewDTO> getJobsFromAction(String actionId, PageRequest pageRequest);

    void processNonePersistenceJob(JobDefinitionDTO jobDocument);

    JobDocument getJobDocument(String hash);

    @LoggingMonitor
    void update(JobDocument jobDocument);

    Pair<String, String> initialJobs(JobDefinitionDTO jobDefinitionDTO, String actionId);

    Map<String, String> getJobsFromAction(String actionId);

    Map<String, String> getEnabledScheduledJobs(String actionId);

    Map<String, String> getEnabledOnetimeJobs(String actionId);

    Map<String, Map<String, String>> getEnabledScheduleJobsGroupByActionId(Set<String> actionIds);

    Page<JobOverviewDTO> getJobs(PageRequest pageRequest);

    void processJob(JobDocument jobDocument, JobResultDocument jobResultDocument,
                    BiConsumer<JobExecutionStatus, JobExecutionStatus> callback, boolean isRelayAction);

    JobDetailDTO getJob(String hash);

    void update(String hash, JobDefinitionDTO jobDefinitionDTO);

    void delete(String jobId);
}
