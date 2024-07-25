package com.hoatv.action.manager.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.hoatv.action.manager.api.ImmutableAction;
import com.hoatv.springboot.common.validation.JsonValue;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;


@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(value = JsonInclude.Include.NON_NULL)
public class ActionDefinitionDTO implements ImmutableAction {

    @JsonProperty("hash")
    private String hash;

    @Setter
    @JsonProperty("name")
    @NotEmpty(message = "Action name cannot be NULL/empty")
    private String actionName;

    @Setter
    @JsonProperty("description")
    private String actionDescription;

    @Setter
    @JsonProperty("isFavorite")
    private boolean isFavorite;

    @Setter
    @JsonProperty("configurations")
    @NotEmpty(message = "Action configurations cannot be NULL/empty")
    @JsonValue(message = "Action configurations must be an JSON object")
    private String configurations;

    @JsonProperty("createdAt")
    private long createdAt;

    @JsonProperty("status")
    @NotEmpty(message = "Action configurations cannot be NULL/empty")
    private String actionStatus;


    @Valid
    @JsonProperty("jobs")
    @NotEmpty(message = "Jobs cannot be NULL/empty")
    private List<JobDefinitionDTO> jobs;
}
