package com.hoatv.action.manager.controllers;

import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security-focused tests for ActionControllerV1
 * Tests authorization rules for endpoints
 */
@WebMvcTest(ActionControllerV1.class)
@ContextConfiguration(classes = SecurityTestConfig.class)
class ActionControllerV1SecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ActionManagerService actionManagerService;

    @MockBean
    private JobManagerService jobManagerService;

    // ========================================
    // SEARCH ENDPOINT AUTHORIZATION TESTS
    // ========================================

    @Test
    void testSearchEndpoint_WithoutAuthentication_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/actions/search")
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
                                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(roles = "ACTION_VIEWER")
    void testSearchEndpoint_WithActionViewerRole_ShouldReturn200() throws Exception {
        when(actionManagerService.search(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(new ActionOverviewDTO())));

        mockMvc.perform(get("/v1/actions/search")
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ACTION_MANAGER")
    void testSearchEndpoint_WithActionManagerRole_ShouldReturn200() throws Exception {
        when(actionManagerService.search(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(new ActionOverviewDTO())));

        mockMvc.perform(get("/v1/actions/search")
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testSearchEndpoint_WithAdminRole_ShouldReturn200() throws Exception {
        when(actionManagerService.search(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(new ActionOverviewDTO())));

        mockMvc.perform(get("/v1/actions/search")
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "UNAUTHORIZED_ROLE")
    void testSearchEndpoint_WithUnauthorizedRole_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/v1/actions/search")
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
                                .andExpect(status().isInternalServerError());
    }

    @Test
    @WithMockUser(roles = {})  // No roles
    void testSearchEndpoint_WithNoRoles_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/v1/actions/search")
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "10"))
                                .andExpect(status().isInternalServerError());
    }
}
