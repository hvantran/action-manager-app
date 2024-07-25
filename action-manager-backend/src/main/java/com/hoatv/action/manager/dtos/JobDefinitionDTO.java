package com.hoatv.action.manager.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hoatv.action.manager.api.JobImmutable;
import com.hoatv.action.manager.collections.JobStatus;
import com.hoatv.springboot.common.validation.JsonValue;
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
public class JobDefinitionDTO implements JobImmutable {

    @JsonProperty("hash")
    private String hash;

    @Setter
    @JsonProperty("name")
    @NotEmpty(message = "Job name cannot be NULL/empty")
    private String jobName;

    @Setter
    @Builder.Default
    @JsonProperty("category")
    private JobCategory jobCategory = JobCategory.IO;

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
    private String scheduleUnit = TimeUnit.MINUTES.name();

    @Setter
    @JsonProperty("outputTargets")
    private List<String> outputTargets = List.of(JobOutputTarget.CONSOLE.name());

    @Setter
    @JsonProperty("configurations")
    @NotEmpty(message = "Job configurations cannot be NULL/empty")
    @JsonValue(message = "Job configurations must be an JSON object")
    private String configurations;

    @JsonProperty("actionId")
    private String actionId;

    @JsonProperty("createdAt")
    private long createdAt;

    @JsonProperty("status")
    private String jobStatus = JobStatus.INITIAL.name();

}
