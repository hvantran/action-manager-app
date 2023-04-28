package com.hoatv.action.manager.services;

import java.util.Map;

public class JobResultFactory {

    private JobResultFactory() {
    }

    public static JobResult createJobResult(String data) {
        return new JobResult(data);
    }

    public static JobResult createJobResult(String data, String exception) {
        return new JobResult(data, exception);
    }

    public static JobResultDict createJobResult(Map<String, String> data) {
        return new JobResultDict(data);
    }

    public static JobResultDict createJobResult(Map<String, String> data, String exception) {
        return new JobResultDict(data, exception);
    }
}
