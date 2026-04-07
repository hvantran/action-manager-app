package com.hoatv.action.manager.controllers;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.action.manager.services.JobManagerStatistics;

/**
 * Search functionality tests for ActionControllerV1
 * Related to Story #195: Action search functionality
 */
@WebMvcTest(ActionControllerV1.class)
@ContextConfiguration(classes = TestConfig.class)
@DisplayName("Action Search API Tests")
class ActionControllerSearchTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MongoDatabaseFactory mongoDatabaseFactory;

    @MockBean
    private ActionManagerService actionManagerService;

    @MockBean
    private JobManagerService jobManagerService;

    @MockBean
    private ActionDocumentRepository actionDocumentRepository;

    @MockBean
    private JobDocumentRepository jobDocumentRepository;

    @MockBean
    private JobExecutionResultDocumentRepository jobExecutionResultDocumentRepository;

    @MockBean
    private JobManagerStatistics jobManagerStatistics;

    private static final String SEARCH_ENDPOINT = "/v1/actions/search";

    // ==================================================
    // AUTHORIZATION TESTS
    // ==================================================

    @Test
    @DisplayName("Should return 401 when user is not authenticated")
    void should_return401_when_userNotAuthenticated() throws Exception {
        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "deploy")
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should return 200 when user is authenticated")
    void should_return200_when_userAuthenticated() throws Exception {
        when(actionManagerService.search(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "deploy")
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isOk());
    }

    // ==================================================
    // SEARCH FUNCTIONALITY TESTS
    // ==================================================

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should find actions by description")
    void should_findActions_when_searchByDescription() throws Exception {
        ActionOverviewDTO action = createActionOverview(
                "deploy-prod",
                "Deploy to Production",
                "Deploy application to production environment"
        );
        when(actionManagerService.search(eq("production"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(action)));

        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "production")
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Deploy to Production")))
                .andExpect(jsonPath("$.content[0].hash", is("deploy-prod")));

        verify(actionManagerService).search(eq("production"), any(Pageable.class));
    }

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should return empty list when no results found")
    void should_returnEmptyList_when_noResultsFound() throws Exception {
        when(actionManagerService.search(eq("nonexistent"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "nonexistent")
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
                // Note: PageResponseDTO doesn't have .empty field
    }

    // ==================================================
    // PAGINATION TESTS
    // ==================================================

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should handle pagination correctly")
    void should_handlePagination() throws Exception {
        List<ActionOverviewDTO> actions = List.of(
                createActionOverview("action-1", "Action 1", "Description 1"),
                createActionOverview("action-2", "Action 2", "Description 2")
        );
        when(actionManagerService.search(eq("test"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(actions, org.springframework.data.domain.PageRequest.of(0, 20), 2));

        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.size", is(20)))
                .andExpect(jsonPath("$.page", is(0))); // PageResponseDTO uses 'page' not 'number'
    }

    // ==================================================
    // VALIDATION TESTS
    // ==================================================

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should return 400 when page index is negative")
    void should_return400_when_pageIndexNegative() throws Exception {
        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "test")
                .param("pageIndex", "-1")
                .param("pageSize", "20"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should return 400 when page size is negative")
    void should_return400_when_pageSizeNegative() throws Exception {
        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should return 400 when page size is zero")
    void should_return400_when_pageSizeZero() throws Exception {
        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "test")
                .param("pageIndex", "0")
                .param("pageSize", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should return 400 when search query is too short")
    void should_return400_when_searchQueryTooShort() throws Exception {
        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", "a")
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser", roles = "ACTION_VIEWER")
    @DisplayName("Should handle special characters safely")
    void should_handleSpecialCharacters_when_searchContainsSpecialChars() throws Exception {
        String specialSearch = "v1.2.3 (beta)";
        when(actionManagerService.search(eq(specialSearch), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        mockMvc.perform(get(SEARCH_ENDPOINT)
                .param("search", specialSearch)
                .param("pageIndex", "0")
                .param("pageSize", "20"))
                .andExpect(status().isOk());

        verify(actionManagerService).search(eq(specialSearch), any(Pageable.class));
    }

    // ==================================================
    // HELPER METHODS
    // ==================================================

    private ActionOverviewDTO createActionOverview(String hash, String name, String description) {
        return ActionOverviewDTO.builder()
                .hash(hash)
                .name(name)
                .isFavorite(false)
                .createdAt(Instant.now().toEpochMilli())
                .numberOfJobs(10)
                .numberOfScheduleJobs(2)
                .numberOfFailureJobs(0)
                .numberOfSuccessJobs(8)
                .numberOfPendingJobs(0)
                .actionStatus(ActionStatus.ACTIVE.name())
                .build();
    }
}
