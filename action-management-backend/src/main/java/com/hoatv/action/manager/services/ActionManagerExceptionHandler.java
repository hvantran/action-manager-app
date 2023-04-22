package com.hoatv.action.manager.services;

import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class ActionManagerExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ActionManagerExceptionHandler.class);

    @ExceptionHandler(value = {EntityNotFoundException.class})
    protected ResponseEntity<Object> handleAppException(RuntimeException ex, WebRequest request) {
        LOGGER.error("An AppException occurred while processing", ex);
        request.setAttribute("jakarta.servlet.error.exception", ex, 0);
        String responseMessage = String.format("{\"message\": \"%s\"}", ex.getMessage());
        request.setAttribute("jakarta.servlet.error.exception", ex, 0);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(responseMessage);
    }
}
