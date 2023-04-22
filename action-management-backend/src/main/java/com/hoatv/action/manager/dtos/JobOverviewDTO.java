package com.hoatv.action.manager.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(value = JsonInclude.Include.NON_NULL)
public class JobOverviewDTO {

    @JsonProperty("hash")
    private String hash;

    @JsonProperty("name")
    private String name;

    @JsonProperty("state")
    private String jobState;

    @JsonProperty("status")
    private String jobStatus;

    @JsonProperty("isSchedule")
    private boolean isSchedule;

    @JsonProperty("failureNotes")
    private String failureNotes;

    @JsonProperty("startedAt")
    private long startedAt;

    @JsonProperty("updatedAt")
    private long updatedAt;

    @JsonProperty("elapsedTime")
    private String elapsedTime;
}
