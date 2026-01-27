package com.hoatv.action.manager.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;

@ExtendWith(MockitoExtension.class)
class JobManagerServiceImplTest {

    @Mock
    private JobDocumentRepository jobDocumentRepository;

    @Mock
    private JobExecutionResultDocumentRepository jobExecutionResultDocumentRepository;

    @Mock
    private ScriptEngineService scriptEngineService;

    @Mock
    private JobManagerStatistics jobManagerStatistics;

    @Mock
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    private JobManagerServiceImpl jobManagerService;

    @BeforeEach
    void setUp() {
        jobManagerService = new JobManagerServiceImpl(
            scriptEngineService,
            jobDocumentRepository,
            jobManagerStatistics,
            jobExecutionResultDocumentRepository,
            mongoTemplate
        );
    }

    @Test
    void testGetJobsFromActionWithoutSearch() {
        String actionId = "action123";
        PageRequest pageRequest = PageRequest.of(0, 10);
        List<JobDocument> jobDocuments = Collections.emptyList();
        Page<JobDocument> jobPage = new PageImpl<>(jobDocuments, pageRequest, 0);

        when(jobDocumentRepository.findJobByActionId(eq(actionId), eq(pageRequest)))
            .thenReturn(jobPage);
        when(jobExecutionResultDocumentRepository.findByJobIdIn(any()))
            .thenReturn(Collections.emptyList());

        Page<JobOverviewDTO> result = jobManagerService.getJobsFromAction(actionId, pageRequest, null);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        verify(jobDocumentRepository).findJobByActionId(eq(actionId), eq(pageRequest));
        verify(jobDocumentRepository, never()).findJobByActionIdAndJobNameContainingIgnoreCase(anyString(), anyString(), any());
    }

    @Test
    void testGetJobsFromActionWithEmptySearch() {
        String actionId = "action123";
        PageRequest pageRequest = PageRequest.of(0, 10);
        List<JobDocument> jobDocuments = Collections.emptyList();
        Page<JobDocument> jobPage = new PageImpl<>(jobDocuments, pageRequest, 0);

        when(jobDocumentRepository.findJobByActionId(eq(actionId), eq(pageRequest)))
            .thenReturn(jobPage);
        when(jobExecutionResultDocumentRepository.findByJobIdIn(any()))
            .thenReturn(Collections.emptyList());

        Page<JobOverviewDTO> result = jobManagerService.getJobsFromAction(actionId, pageRequest, "   ");

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        verify(jobDocumentRepository).findJobByActionId(eq(actionId), eq(pageRequest));
        verify(jobDocumentRepository, never()).findJobByActionIdAndJobNameContainingIgnoreCase(anyString(), anyString(), any());
    }

    @Test
    void testGetJobsFromActionWithSearch() {
        String actionId = "action123";
        String searchText = "test";
        PageRequest pageRequest = PageRequest.of(0, 10);
        List<JobDocument> jobDocuments = Collections.emptyList();
        Page<JobDocument> jobPage = new PageImpl<>(jobDocuments, pageRequest, 0);

        when(jobDocumentRepository.findJobByActionIdAndJobNameContainingIgnoreCase(
            eq(actionId), eq(searchText), eq(pageRequest)))
            .thenReturn(jobPage);
        when(jobExecutionResultDocumentRepository.findByJobIdIn(any()))
            .thenReturn(Collections.emptyList());

        Page<JobOverviewDTO> result = jobManagerService.getJobsFromAction(actionId, pageRequest, searchText);

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        verify(jobDocumentRepository).findJobByActionIdAndJobNameContainingIgnoreCase(
            eq(actionId), eq(searchText), eq(pageRequest));
        verify(jobDocumentRepository, never()).findJobByActionId(anyString(), any());
    }

    @Test
    void testGetJobsFromActionWithSearchTrimsWhitespace() {
        String actionId = "action123";
        String searchText = "  test  ";
        String trimmedSearchText = "test";
        PageRequest pageRequest = PageRequest.of(0, 10);
        List<JobDocument> jobDocuments = Collections.emptyList();
        Page<JobDocument> jobPage = new PageImpl<>(jobDocuments, pageRequest, 0);

        when(jobDocumentRepository.findJobByActionIdAndJobNameContainingIgnoreCase(
            eq(actionId), eq(trimmedSearchText), eq(pageRequest)))
            .thenReturn(jobPage);
        when(jobExecutionResultDocumentRepository.findByJobIdIn(any()))
            .thenReturn(Collections.emptyList());

        Page<JobOverviewDTO> result = jobManagerService.getJobsFromAction(actionId, pageRequest, searchText);

        assertNotNull(result);
        verify(jobDocumentRepository).findJobByActionIdAndJobNameContainingIgnoreCase(
            eq(actionId), eq(trimmedSearchText), eq(pageRequest));
    }
}
