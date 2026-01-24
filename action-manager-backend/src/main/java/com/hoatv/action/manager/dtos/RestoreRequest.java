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
public class RestoreRequest {

    @JsonProperty("targetStatus")
    private ActionStatus targetStatus;
}
