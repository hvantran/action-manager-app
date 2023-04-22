package com.hoatv.action.manager.exceptions;

import com.hoatv.fwk.common.exceptions.AppException;

public class EntityNotFoundException extends AppException {
    public EntityNotFoundException(String message) {
        super(message);
    }

    public EntityNotFoundException(Throwable throwable) {
        super(throwable);
    }

    public EntityNotFoundException(String message, Throwable throwable) {
        super(message, throwable);
    }
}
