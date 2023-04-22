package com.hoatv.action.manager.collections;

import com.hoatv.action.manager.dtos.JobCategory;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.UUID;

@Document("jobs")
@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class JobDocument {

    @Id
    @Builder.Default
    private String hash = UUID.randomUUID().toString();

    private JobCategory jobCategory;
    private String jobContent;
    private String jobDescription;
    private String configurations;
    private String jobName;
    private String actionId;
    private boolean isAsync;
    private List<String> outputTargets;
    private boolean isScheduled;
    private int scheduleInterval;
    private String scheduleUnit;

    private long createdAt;

    private long updatedAt;

    public static JobDocument fromJobDefinition(JobDefinitionDTO jobDefinitionDTO) {
        return fromJobDefinition(jobDefinitionDTO, "");
    }

    public static JobDocument fromJobDefinition(JobDefinitionDTO jobDefinitionDTO, String actionId) {
        return JobDocument.builder()
                .jobName(jobDefinitionDTO.getJobName())
                .jobDescription(jobDefinitionDTO.getJobDescription())
                .configurations(jobDefinitionDTO.getConfigurations())
                .jobContent(jobDefinitionDTO.getJobContent())
                .jobCategory(JobCategory.valueOf(jobDefinitionDTO.getJobCategory()))
                .isAsync(jobDefinitionDTO.isAsync())
                .scheduleUnit(jobDefinitionDTO.getScheduleTimeUnit())
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
                .jobCategory(jobDocument.getJobCategory().name())
                .outputTargets(jobDocument.getOutputTargets())
                .isScheduled(jobDocument.isScheduled())
                .scheduleInterval(jobDocument.getScheduleInterval())
                .scheduleTimeUnit(jobDocument.getScheduleUnit())
                .createdAt(jobDocument.getCreatedAt())
                .isAsync(jobDocument.isAsync())
                .build();
    }
}
