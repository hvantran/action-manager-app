package com.hoatv.action.manager.api;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

public interface JobResultImmutable {

    Object getData();

    String getException();
}
