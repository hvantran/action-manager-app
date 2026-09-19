package com.hoatv.action.manager.services;

import com.hoatv.action.manager.utils.UserContext;
import com.hoatv.fwk.common.services.OutboundRequestAuth;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OutboundJobAuthBinderTest {

    @Mock
    private UserContext userContext;

    @AfterEach
    void tearDown() {
        OutboundRequestAuth.clear();
    }

    @Test
    void bindsJwtForTheDurationOfTheCallAndClearsAfterward() {
        Jwt jwt = jwtWithValue("user-token");
        when(userContext.getCurrentJwt()).thenReturn(Optional.of(jwt));
        OutboundJobAuthBinder binder = new OutboundJobAuthBinder(userContext);

        String seen = binder.run(() -> OutboundRequestAuth.getBearerToken().orElse("missing"));

        assertEquals("user-token", seen);
        assertTrue(OutboundRequestAuth.getBearerToken().isEmpty());
    }

    @Test
    void clearsTokenWhenWorkThrows() {
        Jwt jwt = jwtWithValue("user-token");
        when(userContext.getCurrentJwt()).thenReturn(Optional.of(jwt));
        OutboundJobAuthBinder binder = new OutboundJobAuthBinder(userContext);

        assertThrows(IllegalStateException.class, () -> binder.run(() -> {
            throw new IllegalStateException("boom");
        }));
        assertTrue(OutboundRequestAuth.getBearerToken().isEmpty());
    }

    @Test
    void runsWithoutBindingWhenThereIsNoUser() {
        when(userContext.getCurrentJwt()).thenReturn(Optional.empty());
        OutboundJobAuthBinder binder = new OutboundJobAuthBinder(userContext);

        boolean empty = Boolean.TRUE.equals(binder.run(() -> OutboundRequestAuth.getBearerToken().isEmpty()));

        assertTrue(empty);
    }

    private static Jwt jwtWithValue(String tokenValue) {
        Instant now = Instant.now();
        return new Jwt(tokenValue, now, now.plusSeconds(60), Map.of("alg", "none"), Map.of("sub", "user"));
    }
}
