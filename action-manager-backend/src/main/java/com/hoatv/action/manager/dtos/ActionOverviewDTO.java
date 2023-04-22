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
public class ActionOverviewDTO {

    @JsonProperty("hash")
    private String hash;

    @JsonProperty("name")
    private String name;

    @JsonProperty("createdAt")
    private long createdAt;

    @JsonProperty("numberOfJobs")
    private long numberOfJobs;

    @JsonProperty("numberOfSuccessJobs")
    private long numberOfSuccessJobs;

    @JsonProperty("numberOfFailureJobs")
    private long numberOfFailureJobs;

    @JsonProperty("numberOfScheduleJobs")
    private long numberOfScheduleJobs;

    @JsonProperty("isFavorite")
    private boolean isFavorite;
}
