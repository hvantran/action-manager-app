package com.hoatv.action.manager.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@FunctionalInterface
public interface Launcher {

    Logger LOGGER = LoggerFactory.getLogger(Launcher.class);

    default void preExecute(String... args) {
        LOGGER.info("Execute pre executing method");
    }

    <TResult> TResult execute(String... args);

    default <TResult> TResult postExecute(TResult result, String... args) {
        LOGGER.info("Execute post executing method");
        return result;
    }
}
