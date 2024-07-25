package com.hoatv.action.manager.api;

import com.hoatv.action.manager.collections.JobStatus;
import com.hoatv.action.manager.dtos.JobCategory;

import java.util.List;

public interface ImmutableJob {

    String getHash();

    String getJobName();

    JobCategory getJobCategory();

    String getJobContent();

    String getJobDescription();

    boolean isAsync();

    boolean isScheduled();

    int getScheduleInterval();

    String getScheduleUnit();

    List<String> getOutputTargets();

    String getConfigurations();

    String getActionId();
    
    JobStatus getJobStatus();
}
