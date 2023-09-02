package com.hoatv.action.manager.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@FunctionalInterface
public interface Launcher {

    Logger LOGGER = LoggerFactory.getLogger(Launcher.class);

    default Map<String, String> preExecute(String... args) {
        LOGGER.debug("Execute pre executing method");
        return null;
    }

    <TResult> TResult execute(Map<String, String> preExecuteParams, String... args);

    default <TResult> TResult postExecute(TResult result, Map<String, String> preExecuteParams, String... args) {
        LOGGER.debug("Execute post executing method");
        return result;
    }
}
