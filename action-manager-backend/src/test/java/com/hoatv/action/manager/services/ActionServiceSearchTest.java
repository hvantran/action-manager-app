package com.hoatv.action.manager.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.action.manager.services.ActionManagerStatistics.ActionStatistics;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Service layer tests for action search functionality
 * Related to Story #195: Action search functionality
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Action Service Search Tests")
class ActionServiceSearchTest {

    @Mock
    private ActionDocumentRepository actionDocumentRepository;

    @Mock
    private JobDocumentRepository jobDocumentRepository;

    @Mock
    private JobExecutionResultDocumentRepository jobResultDocumentRepository;

    @Mock
    private JobManagerService jobManagerService;

    @Mock
    private ActionManagerStatistics actionManagerStatistics;

    @InjectMocks
    private ActionManagerServiceImpl actionManagerService;

    private Pageable defaultPageable;

    @BeforeEach
    void setUp() {
        Sort defaultSort = Sort.by(
                Sort.Order.desc("isFavorite"),
                Sort.Order.desc("createdAt")
        );
        defaultPageable = PageRequest.of(0, 20, defaultSort);
    }

    // ==================================================
    // SEARCH LOGIC TESTS
    // ==================================================

    @Test
    @DisplayName("Should call repository with correct search parameters")
    void should_callRepository_when_searchInvoked() {
        String searchTerm = "deploy";
        when(actionDocumentRepository.searchByNameOrDescription(eq(searchTerm), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        actionManagerService.search(searchTerm, defaultPageable);

        verify(actionDocumentRepository, times(1))
                .searchByNameOrDescription(eq(searchTerm), eq(defaultPageable));
    }

    @Test
    @DisplayName("Should map ActionDocument to ActionOverviewDTO correctly")
    void should_mapDocumentToDTO_when_resultsReturned() {
        ActionDocument document = createActionDocument(
                "action-1",
                "Deploy Application",
                "Deploy to production",
                true
        );
        when(actionDocumentRepository.searchByNameOrDescription(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(document)));
        ActionStatistics stats = ActionStatistics.builder()
                .numberOfJobs(new AtomicLong(12))
                .numberOfScheduleJobs(new AtomicLong(2))
                .numberOfFailureJobs(new AtomicLong(1))
                .numberOfSuccessJobs(new AtomicLong(9))
                .numberOfPendingJobs(new AtomicLong(0))
                .build();
        when(actionManagerStatistics.getActionStats("action-1")).thenReturn(stats);

        Page<ActionOverviewDTO> result = actionManagerService.search("deploy", defaultPageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        ActionOverviewDTO dto = result.getContent().get(0);
        assertEquals("action-1", dto.getHash());
        assertEquals("Deploy Application", dto.getName());
        assertTrue(dto.isFavorite());
        assertEquals(ActionStatus.ACTIVE.name(), dto.getActionStatus());
        assertEquals(12, dto.getNumberOfJobs());
        assertEquals(2, dto.getNumberOfScheduleJobs());
        assertEquals(1, dto.getNumberOfFailureJobs());
    }

    @Test
    @DisplayName("Should preserve pagination metadata accurately")
    void should_preservePaginationMetadata_when_resultsReturned() {
        List<ActionDocument> documents = createMultipleDocuments(10);
        Pageable pageable = PageRequest.of(2, 10, Sort.by(Sort.Order.desc("createdAt")));
        PageImpl<ActionDocument> documentPage = new PageImpl<>(documents, pageable, 50);
        
        when(actionDocumentRepository.searchByNameOrDescription(anyString(), any(Pageable.class)))
                .thenReturn(documentPage);
        ActionStatistics stats = ActionStatistics.builder()
                .numberOfJobs(new AtomicLong(5))
                .numberOfScheduleJobs(new AtomicLong(1))
                .numberOfFailureJobs(new AtomicLong(0))
                .numberOfSuccessJobs(new AtomicLong(5))
                .numberOfPendingJobs(new AtomicLong(0))
                .build();
        when(actionManagerStatistics.getActionStats(anyString())).thenReturn(stats);

        Page<ActionOverviewDTO> result = actionManagerService.search("test", pageable);

        assertEquals(50, result.getTotalElements());
        assertEquals(5, result.getTotalPages());
        assertEquals(10, result.getSize());
        assertEquals(2, result.getNumber());
        assertEquals(10, result.getNumberOfElements());
        assertFalse(result.isFirst());
        assertFalse(result.isLast());
    }

    // ==================================================
    // EDGE CASE TESTS
    // ==================================================

    @Test
    @DisplayName("Should handle empty database")
    void should_returnEmptyPage_when_databaseEmpty() {
        when(actionDocumentRepository.searchByNameOrDescription(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<ActionOverviewDTO> result = actionManagerService.search("anything", defaultPageable);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        assertEquals(0, result.getContent().size());
        assertTrue(result.isEmpty());
        assertTrue(result.isFirst());
        assertTrue(result.isLast());
    }

    @Test
    @DisplayName("Should handle null search term gracefully")
    void should_handleNull_when_searchTermNull() {
        when(actionDocumentRepository.searchByNameOrDescription(isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<ActionOverviewDTO> result = actionManagerService.search(null, defaultPageable);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(actionDocumentRepository).searchByNameOrDescription(isNull(), eq(defaultPageable));
    }

    @Test
    @DisplayName("Should handle empty string search term")
    void should_handleEmptyString_when_searchTermEmpty() {
        when(actionDocumentRepository.searchByNameOrDescription(eq(""), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<ActionOverviewDTO> result = actionManagerService.search("", defaultPageable);

        assertNotNull(result);
        verify(actionDocumentRepository).searchByNameOrDescription(eq(""), eq(defaultPageable));
    }

    @Test
    @DisplayName("Should handle very long search term")
    void should_handleLongSearchTerm_when_exceeds1000Chars() {
        String longSearchTerm = "a".repeat(1500);
        when(actionDocumentRepository.searchByNameOrDescription(eq(longSearchTerm), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<ActionOverviewDTO> result = actionManagerService.search(longSearchTerm, defaultPageable);

        assertNotNull(result);
        verify(actionDocumentRepository).searchByNameOrDescription(eq(longSearchTerm), eq(defaultPageable));
    }

    @Test
    @DisplayName("Should handle special characters in search")
    void should_handleSpecialCharacters_when_searchContainsSpecialChars() {
        String specialSearch = "v1.2.3 (beta)";
        when(actionDocumentRepository.searchByNameOrDescription(eq(specialSearch), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<ActionOverviewDTO> result = actionManagerService.search(specialSearch, defaultPageable);

        assertNotNull(result);
        verify(actionDocumentRepository).searchByNameOrDescription(eq(specialSearch), eq(defaultPageable));
    }

    // ==================================================
    // PAGINATION METADATA TESTS
    // ==================================================

    @Test
    @DisplayName("Should identify first page correctly")
    void should_identifyFirstPage_when_pageIndexZero() {
        List<ActionDocument> documents = createMultipleDocuments(10);
        when(actionDocumentRepository.searchByNameOrDescription(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(documents, PageRequest.of(0, 10), 50));
        ActionStatistics stats = ActionStatistics.builder()
                .numberOfJobs(new AtomicLong(5))
                .numberOfScheduleJobs(new AtomicLong(1))
                .numberOfFailureJobs(new AtomicLong(0))
                .numberOfSuccessJobs(new AtomicLong(5))
                .numberOfPendingJobs(new AtomicLong(0))
                .build();
        when(actionManagerStatistics.getActionStats(anyString())).thenReturn(stats);

        Page<ActionOverviewDTO> result = actionManagerService.search("test", PageRequest.of(0, 10));

        assertTrue(result.isFirst());
        assertFalse(result.isLast());
    }

    @Test
    @DisplayName("Should identify last page correctly")
    void should_identifyLastPage_when_finalPage() {
        List<ActionDocument> documents = createMultipleDocuments(5);
        when(actionDocumentRepository.searchByNameOrDescription(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(documents, PageRequest.of(4, 10), 45));
        ActionStatistics stats = ActionStatistics.builder()
                .numberOfJobs(new AtomicLong(3))
                .numberOfScheduleJobs(new AtomicLong(0))
                .numberOfFailureJobs(new AtomicLong(1))
                .numberOfSuccessJobs(new AtomicLong(2))
                .numberOfPendingJobs(new AtomicLong(0))
                .build();
        when(actionManagerStatistics.getActionStats(anyString())).thenReturn(stats);

        Page<ActionOverviewDTO> result = actionManagerService.search("test", PageRequest.of(4, 10));

        assertFalse(result.isFirst());
        assertTrue(result.isLast());
    }

    @Test
    @DisplayName("Should handle single page result")
    void should_handleSinglePage_when_allResultsFitOnePage() {
        List<ActionDocument> documents = createMultipleDocuments(5);
        when(actionDocumentRepository.searchByNameOrDescription(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(documents, PageRequest.of(0, 20), 5));
        ActionStatistics stats = ActionStatistics.builder()
                .numberOfJobs(new AtomicLong(2))
                .numberOfScheduleJobs(new AtomicLong(0))
                .numberOfFailureJobs(new AtomicLong(0))
                .numberOfSuccessJobs(new AtomicLong(2))
                .numberOfPendingJobs(new AtomicLong(0))
                .build();
        when(actionManagerStatistics.getActionStats(anyString())).thenReturn(stats);

        Page<ActionOverviewDTO> result = actionManagerService.search("test", PageRequest.of(0, 20));

        assertTrue(result.isFirst());
        assertTrue(result.isLast());
        assertEquals(1, result.getTotalPages());
        assertEquals(5, result.getTotalElements());
    }

    // ==================================================
    // HELPER METHODS
    // ==================================================

    private ActionDocument createActionDocument(String hash, String name, String description, boolean isFavorite) {
        ActionDocument document = new ActionDocument();
        document.setHash(hash);
        document.setActionName(name);
        document.setActionDescription(description);
        document.setFavorite(isFavorite);
        document.setActionStatus(ActionStatus.ACTIVE);
        document.setCreatedAt(Instant.now().toEpochMilli());
        return document;
    }

    private List<ActionDocument> createMultipleDocuments(int count) {
        List<ActionDocument> documents = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            documents.add(createActionDocument(
                    "action-" + i,
                    "Action " + i,
                    "Description " + i,
                    i % 3 == 0
            ));
        }
        return documents;
    }
}
