package com.hoatv.action.manager.document.transformers;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobStatus;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;

public final class JobTransformer {
    private JobTransformer() {}
    public static JobDocument fromJobDefinition(JobDefinitionDTO jobDefinitionDTO) {
        return fromJobDefinition(jobDefinitionDTO, "");
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
                .isAsync(jobDocument.isAsync())
                .jobStatus(jobDocument.getJobStatus().name())
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
                .status(jobDocument.getJobStatus().name())
                .build();
    }
}
