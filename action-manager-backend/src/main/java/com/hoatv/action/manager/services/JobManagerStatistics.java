package com.hoatv.action.manager.services;

import com.hoatv.metric.mgmt.annotations.Metric;
import com.hoatv.metric.mgmt.annotations.MetricProvider;
import com.hoatv.metric.mgmt.entities.ComplexValue;
import com.hoatv.metric.mgmt.services.MetricService;
import com.hoatv.task.mgmt.services.ScheduleTaskMgmtService;
import com.hoatv.task.mgmt.services.TaskMgmtServiceV1;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.concurrent.atomic.AtomicLong;

import static com.hoatv.action.manager.utils.JobManagerConstants.JOB_MANAGER_METRIC_NAME_PREFIX;


@Component
@MetricProvider(application = JobManagerServiceImpl.ACTION_MANAGER, category = "job-manager-stats-data")
public class JobManagerStatistics {

    private final AtomicLong totalNumberOfJobs = new AtomicLong(0);

    private final AtomicLong numberOfActiveJobs = new AtomicLong(0);

    private final AtomicLong numberOfFailureJobs = new AtomicLong(0);

    @Setter
    private TaskMgmtServiceV1 ioTaskMgmtService;

    @Setter
    private MetricService metricService;

    @Setter
    private TaskMgmtServiceV1 cpuTaskMgmtService;

    @Setter
    private ScheduleTaskMgmtService scheduleTaskMgmtService;

    public void setTotalNumberOfJobs(long totalNumberOfJobs) {
        this.totalNumberOfJobs.set(totalNumberOfJobs);
    }

    public void setNumberOfFailureJobs(long numberOfFailureJobs) {
        this.numberOfFailureJobs.set(numberOfFailureJobs);
    }

    public void increaseNumberOfJobs() {
        this.totalNumberOfJobs.incrementAndGet();
    }

    public void increaseNumberOfProcessingJobs() {
        this.numberOfActiveJobs.incrementAndGet();
    }

    public void increaseNumberOfFailureJobs() {
        this.numberOfFailureJobs.incrementAndGet();
    }

    public void decreaseNumberOfProcessingJobs() {
        this.numberOfActiveJobs.decrementAndGet();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX)
    public Collection<ComplexValue> getMetricValues() {
        return metricService.getMetrics().values();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-jobs")
    public long getTotalNumberOfJobs() {
        return totalNumberOfJobs.get();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-failure-jobs")
    public long getTotalNumberOfFailureJobs() {
        return numberOfFailureJobs.get();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-processing-jobs")
    public long getTotalNumberOfActiveJobs() {
        return numberOfActiveJobs.get();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-active-schedule-jobs")
    public long getNumberOfScheduleJobs() {
        return scheduleTaskMgmtService.getActiveTasks();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-available-schedule-jobs")
    public long getNumberOfAvailableScheduleJobs() {
        return scheduleTaskMgmtService.getConcurrentAccountLocks().availablePermits();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-available-cpu-jobs")
    public long getNumberOfAvailableCPUJobs() {
        return cpuTaskMgmtService.getConcurrentAccountLocks().availablePermits();
    }

    @Metric(name = JOB_MANAGER_METRIC_NAME_PREFIX + "-number-of-available-io-jobs")
    public long getNumberOfAvailableIOJobs() {
        return ioTaskMgmtService.getConcurrentAccountLocks().availablePermits();
    }

}
