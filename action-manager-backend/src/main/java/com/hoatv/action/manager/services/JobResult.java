package com.hoatv.action.manager.services;

import com.hoatv.action.manager.api.ImmutableJobResult;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@ToString
@Getter
@Builder
public class JobResult implements ImmutableJobResult {

    private Object data;

    private String exception;

    public JobResult(Object data) {
        this.data = data;
    }

    public JobResult(Object data, String exception) {
        this.data = data;
        this.exception = exception;
    }
}
