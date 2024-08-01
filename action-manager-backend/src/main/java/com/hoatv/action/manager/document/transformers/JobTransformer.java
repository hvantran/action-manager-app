package com.hoatv.action.manager.document.transformers;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import org.apache.commons.lang3.time.DurationFormatUtils;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Supplier;

public final class JobTransformer {
    private JobTransformer() {
    }

    public static JobDocument fromJobDefinition(JobDefinitionDTO jobDefinitionDTO) {
        return fromJobDefinition(jobDefinitionDTO, "");
    }


    public static void updateFromJobDefinitionDTO(JobDocument jobDocument, JobDefinitionDTO jobDefinitionDTO) {
        jobDocument.setJobName(jobDefinitionDTO.getJobName());
        jobDocument.setJobDescription(jobDefinitionDTO.getJobDescription());
        jobDocument.setConfigurations(jobDefinitionDTO.getConfigurations());
        jobDocument.setJobContent(jobDefinitionDTO.getJobContent());
        jobDocument.setJobCategory(jobDefinitionDTO.getJobCategory());
        jobDocument.setAsync(jobDefinitionDTO.isAsync());
        jobDocument.setScheduleUnit(jobDefinitionDTO.getScheduleUnit());
        jobDocument.setJobStatus(jobDefinitionDTO.getJobStatus());
        jobDocument.setScheduled(jobDefinitionDTO.isScheduled());
        jobDocument.setScheduleInterval(jobDefinitionDTO.getScheduleInterval());
        jobDocument.setContentTemplates(jobDefinitionDTO.getContentTemplates());
        jobDocument.setOutputTargets(jobDefinitionDTO.getOutputTargets());
    }

    public static JobDocument fromJobDefinition(JobDefinitionDTO jobDefinitionDTO, String actionId) {
        return JobDocument.builder()
                .jobName(jobDefinitionDTO.getJobName())
                .jobDescription(jobDefinitionDTO.getJobDescription())
                .configurations(jobDefinitionDTO.getConfigurations())
                .jobContent(jobDefinitionDTO.getJobContent())
                .jobStatus(jobDefinitionDTO.getJobStatus())
                .jobCategory(jobDefinitionDTO.getJobCategory())
                .isAsync(jobDefinitionDTO.isAsync())
                .scheduleUnit(jobDefinitionDTO.getScheduleUnit())
                .isScheduled(jobDefinitionDTO.isScheduled())
                .contentTemplates(jobDefinitionDTO.getContentTemplates())
                .scheduleInterval(jobDefinitionDTO.getScheduleInterval())
                .outputTargets(jobDefinitionDTO.getOutputTargets())
                .createdAt(DateTimeUtils.getCurrentEpochTimeInSecond())
                .actionId(actionId)
                .build();
    }

    public static JobDefinitionDTO toJobDefinition(JobDocument jobDocument) {
        return JobDefinitionDTO.builder()
                .jobName(jobDocument.getJobName())
                .jobDescription(jobDocument.getJobDescription())
                .configurations(jobDocument.getConfigurations())
                .jobContent(jobDocument.getJobContent())
                .jobCategory(jobDocument.getJobCategory())
                .outputTargets(jobDocument.getOutputTargets())
                .isScheduled(jobDocument.isScheduled())
                .scheduleInterval(jobDocument.getScheduleInterval())
                .scheduleUnit(jobDocument.getScheduleUnit())
                .createdAt(jobDocument.getCreatedAt())
                .contentTemplates(jobDocument.getContentTemplates())
                .isAsync(jobDocument.isAsync())
                .jobStatus(jobDocument.getJobStatus())
                .build();
    }

    public static JobDetailDTO jobDetailDTO(JobDocument jobDocument) {
        return JobDetailDTO.builder()
                .jobName(jobDocument.getJobName())
                .jobDescription(jobDocument.getJobDescription())
                .configurations(jobDocument.getConfigurations())
                .jobContent(jobDocument.getJobContent())
                .jobCategory(jobDocument.getJobCategory().name())
                .outputTargets(jobDocument.getOutputTargets())
                .isScheduled(jobDocument.isScheduled())
                .scheduleInterval(jobDocument.getScheduleInterval())
                .scheduleTimeUnit(jobDocument.getScheduleUnit())
                .isAsync(jobDocument.isAsync())
                .contentTemplates(jobDocument.getContentTemplates())
                .status(jobDocument.getJobStatus().name())
                .build();
    }

    public static Page<JobOverviewDTO> getJobOverviewDTOs(
            Page<JobDocument> jobDocuments,
            List<JobResultDocument> jobResultDocuments) {
        
        return jobDocuments.map(jobDocument -> {
            String jobId = jobDocument.getHash();
            Optional<JobResultDocument> jobExecutionResultDocument =
                    jobResultDocuments.stream().filter(p -> p.getJobId().equals(jobId)).findFirst();
            if (jobExecutionResultDocument.isEmpty()) {
                return null;
            }
            Supplier<JobResultDocument> defaultJobResult = () -> JobResultDocument.builder().build();
            JobResultDocument jobStat = jobExecutionResultDocument.orElseGet(defaultJobResult);
            String jobState = Objects.isNull(jobStat.getJobState()) ? "" : jobStat.getJobState().name();
            String jobStatus = Objects.isNull(jobStat.getJobExecutionStatus()) ? "" : jobStat.getJobExecutionStatus().name();
            long elapsedTimeAsLong = jobStat.getElapsedTime();
            String elapsedTimeString = DurationFormatUtils.formatDuration(elapsedTimeAsLong, "HH:mm:ss.S");
            String elapsedTime = elapsedTimeAsLong == 0 ? "" : elapsedTimeString;
            return JobOverviewDTO.builder()
                    .name(jobDocument.getJobName())
                    .hash(jobId)
                    .jobState(jobState)
                    .jobExecutionStatus(jobStatus)
                    .status(jobDocument.getJobStatus().name())
                    .jobExecutionStatus(jobStat.getJobExecutionStatus().name())
                    .isSchedule(jobDocument.isScheduled())
                    .startedAt(jobStat.getStartedAt())
                    .updatedAt(jobStat.getUpdatedAt())
                    .elapsedTime(elapsedTime)
                    .failureNotes(jobStat.getFailureNotes())
                    .actionHash(jobDocument.getActionId())
                    .build();
        });
    }
}
