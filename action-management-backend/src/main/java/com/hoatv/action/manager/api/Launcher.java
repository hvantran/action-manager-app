package com.hoatv.action.manager.api;

@FunctionalInterface
public interface Launcher {

    <TResult> TResult execute(String... args);
}
