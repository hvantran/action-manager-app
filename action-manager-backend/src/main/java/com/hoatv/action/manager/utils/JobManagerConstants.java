package com.hoatv.action.manager.utils;

import com.hoatv.action.manager.collections.JobStatus;

import java.util.List;

public class JobManagerConstants {

    private JobManagerConstants() {

    }
    public static final String JOB_MANAGER_METRIC_NAME_PREFIX = "job-manager";

    public static final String IO_JOB_MANAGER_APPLICATION = "io-" + JOB_MANAGER_METRIC_NAME_PREFIX;

    public static final String CPU_JOB_MANAGER_APPLICATION = "cpu-" + JOB_MANAGER_METRIC_NAME_PREFIX;

    public static final List<JobStatus> VALID_JOB_STATUS_TO_RUN = List.of(JobStatus.ACTIVE);
}
