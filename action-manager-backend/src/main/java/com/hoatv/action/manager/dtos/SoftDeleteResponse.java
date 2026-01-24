package com.hoatv.action.manager.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hoatv.action.manager.collections.ActionStatus;
import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(value = JsonInclude.Include.NON_NULL)
public class SoftDeleteResponse {

    @JsonProperty("actionId")
    private String actionId;

    @JsonProperty("actionStatus")
    private ActionStatus actionStatus;

    @JsonProperty("deletedAt")
    private Long deletedAt;

    @JsonProperty("message")
    private String message;
}
