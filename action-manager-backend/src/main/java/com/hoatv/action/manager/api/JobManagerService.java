package com.hoatv.action.manager.api;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.dtos.JobStatus;
import com.hoatv.action.manager.services.ActionExecutionContext;
import com.hoatv.fwk.common.ultilities.Pair;
import java.util.function.BiConsumer;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

public interface JobManagerService {
    long count (Example<JobDocument> example);

    void deleteJobsByActionId (String actionId);

    void processBulkJobs (ActionExecutionContext actionExecutionContext);

    void processBulkJobs (List<ActionExecutionContext> actionExecutionContexts);

    Page<JobOverviewDTO> getJobsFromAction (String actionId, PageRequest pageRequest);

    List<Pair<JobDocument, JobResultDocument>> getScheduleJobPairs ();

    void processNonePersistenceJob(JobDefinitionDTO jobDocument);

    Pair<JobDocument, JobResultDocument> initialJobs (JobDefinitionDTO jobDefinitionDTO, String actionId);

    List<Pair<JobDocument, JobResultDocument>> getJobsFromAction (String actionId);

    List<Pair<JobDocument, JobResultDocument>> getScheduledJobsFromAction (String actionId);

    List<Pair<JobDocument, JobResultDocument>> getOneTimeJobsFromAction (String actionId);

    void processJob (JobDocument jobDocument, JobResultDocument jobResultDocument, BiConsumer<JobStatus, JobStatus> callback);

    Page<JobOverviewDTO> getJobs (PageRequest pageRequest);

    JobDetailDTO getJob (String hash);
}
