package com.hoatv.action.manager.api;

import com.hoatv.action.manager.services.JobResult;
import com.hoatv.fwk.common.services.CheckedConsumer;

public interface OutputTarget {

    void processJobResult(CheckedConsumer<JobResult> jobResultConsumer, JobResult jobResult);
}
