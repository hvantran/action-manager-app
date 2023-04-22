package com.hoatv.action.manager.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hoatv.springboot.common.validation.ValueOfEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(value = JsonInclude.Include.NON_NULL)
public class JobDefinitionDTO {

    @JsonProperty("hash")
    private String hash;

    @Setter
    @JsonProperty("name")
    @NotEmpty(message = "Job name cannot be NULL/empty")
    private String jobName;

    @Setter
    @Builder.Default
    @JsonProperty("category")
    @ValueOfEnum(JobCategory.class)
    private String jobCategory = JobCategory.IO.name();

    @Setter
    @JsonProperty("content")
    @NotEmpty(message = "Job content cannot be NULL/empty")
    private String jobContent;

    @Setter
    @JsonProperty("description")
    private String jobDescription;

    @Setter
    @JsonProperty("isAsync")
    private boolean isAsync;

    @Setter
    @JsonProperty("isScheduled")
    private boolean isScheduled;

    @Setter
    @JsonProperty("scheduleInterval")
    @Min(value = 0, message = "Schedule interval cannot less than zero")
    private int scheduleInterval;

    @Builder.Default
    @JsonProperty("scheduleTimeUnit")
    private String scheduleTimeUnit = TimeUnit.MINUTES.name();

    @Setter
    @JsonProperty("outputTargets")
    private List<String> outputTargets = List.of(JobOutputTarget.CONSOLE.name());

    @Setter
    @JsonProperty("configurations")
    @NotEmpty(message = "Job configurations cannot be NULL/empty")
    private String configurations;

    @JsonProperty("action_id")
    private String actionId;

    @JsonProperty("created_at")
    private long createdAt;
}
