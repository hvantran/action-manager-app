package com.hoatv.action.manager.services;

import com.hoatv.fwk.common.services.HttpClientService;
import com.hoatv.fwk.common.services.OutboundRequestAuth;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OutboundRequestAuthTest {

    @AfterEach
    void tearDown() {
        OutboundRequestAuth.clear();
    }

    @Test
    void doesNotAttachAuthorizationToPublicHosts() {
        OutboundRequestAuth.setBearerToken("secret-jwt");
        Map<String, String> headers = new HashMap<>();
        headers.put("User-Agent", "Mozilla/5.0");

        OutboundRequestAuth.mergeAuthorizationHeader(
                "https://m.lazada.vn/products/i1-s2.html", headers);
        OutboundRequestAuth.mergeAuthorizationHeader(
                "https://hasaki.vn/mobile/v3/detail/product?product_id=1", headers);

        assertFalse(headers.containsKey(OutboundRequestAuth.AUTHORIZATION));
    }

    @Test
    void attachesBearerTokenToInternalHostsWhenBound() {
        OutboundRequestAuth.setBearerToken("secret-jwt");
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");

        OutboundRequestAuth.mergeAuthorizationHeader(
                "http://localhost:8082/action-manager-backend/v1/actions/a/jobs", headers);

        assertEquals("Bearer secret-jwt", headers.get(OutboundRequestAuth.AUTHORIZATION));
    }

    @Test
    void attachesBearerTokenToDockerInternalHostname() {
        OutboundRequestAuth.setBearerToken("secret-jwt");
        Map<String, String> headers = new HashMap<>();

        OutboundRequestAuth.mergeAuthorizationHeader(
                "http://action-manager-backend:8082/action-manager-backend/v1/actions/a/jobs",
                headers);

        assertEquals("Bearer secret-jwt", headers.get(OutboundRequestAuth.AUTHORIZATION));
    }

    @Test
    void doesNotOverrideExplicitAuthorization() {
        OutboundRequestAuth.setBearerToken("secret-jwt");
        Map<String, String> headers = new HashMap<>();
        headers.put("authorization", "Bearer already-set");

        OutboundRequestAuth.mergeAuthorizationHeader("http://localhost:8082/jobs", headers);

        assertEquals("Bearer already-set", headers.get("authorization"));
        assertNull(headers.get(OutboundRequestAuth.AUTHORIZATION));
    }

    @Test
    void doesNotAttachWhenJwtIsMissing() {
        Map<String, String> headers = new HashMap<>();

        OutboundRequestAuth.mergeAuthorizationHeader("http://localhost:8082/jobs", headers);

        assertFalse(headers.containsKey(OutboundRequestAuth.AUTHORIZATION));
    }

    @Test
    void treats401AsUnsuccessfulForFactoryScripts() {
        assertFalse(HttpClientService.is2xx(null));

        @SuppressWarnings("unchecked")
        HttpResponse<String> unauthorized = mock(HttpResponse.class);
        when(unauthorized.statusCode()).thenReturn(401);
        @SuppressWarnings("unchecked")
        HttpResponse<String> created = mock(HttpResponse.class);
        when(created.statusCode()).thenReturn(201);

        assertFalse(HttpClientService.is2xx(unauthorized));
        assertTrue(HttpClientService.is2xx(created));
        assertTrue(OutboundRequestAuth.isInternalUrl("http://127.0.0.1:8082/x"));
        assertFalse(OutboundRequestAuth.isInternalUrl("https://www.lazada.vn/products/x.html"));
    }
}
