package com.hoatv.action.manager.services;

import com.hoatv.action.manager.utils.UserContext;
import com.hoatv.fwk.common.services.OutboundRequestAuth;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

/**
 * Binds the current request JWT onto outbound script HTTP for one call stack.
 */
@Component
public class OutboundJobAuthBinder {

    private final UserContext userContext;

    public OutboundJobAuthBinder(UserContext userContext) {
        this.userContext = userContext;
    }

    public <T> T run(Supplier<T> work) {
        try {
            userContext.getCurrentJwt()
                    .map(Jwt::getTokenValue)
                    .ifPresent(OutboundRequestAuth::setBearerToken);
            return work.get();
        } finally {
            OutboundRequestAuth.clear();
        }
    }
}
