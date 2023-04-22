package com.hoatv.action.manager.services;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@ToString
@Getter
@Builder
public class JobResult {

    private String data;
    private String exception;

    public JobResult() {
    }

    public JobResult(String data) {
        this.data = data;
    }

    public JobResult(String data, String exception) {
        this.data = data;
        this.exception = exception;
    }
}
