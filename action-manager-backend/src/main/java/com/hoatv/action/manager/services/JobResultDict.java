package com.hoatv.action.manager.services;

import com.hoatv.action.manager.api.JobResultImmutable;
import java.util.Collection;
import java.util.Map;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@ToString
@Getter
@Builder
public class JobResultDict implements JobResultImmutable {

    private Map<String, String> data;
    private String exception;

    public JobResultDict () {
    }

    public JobResultDict (Map<String, String> data) {
        this.data = data;
    }

    public JobResultDict (Map<String, String> data, String exception) {
        this.data = data;
        this.exception = exception;
    }
}
