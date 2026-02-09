package com.hoatv.action.manager.services;

import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobStatus;
import com.hoatv.action.manager.dtos.RestoreResponse;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.fwk.common.exceptions.EntityNotFoundException;
import com.hoatv.fwk.common.exceptions.InvalidArgumentException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionManagerServiceSoftDeleteTest {

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

    private ActionDocument testAction;
    private List<JobDocument> testJobs;

    @BeforeEach
    void setUp() {
        testAction = ActionDocument.builder()
                .hash("action-id-1")
                .actionName("Test Action")
                .actionStatus(ActionStatus.ACTIVE)
                .createdAt(System.currentTimeMillis() / 1000)
                .build();

        JobDocument job1 = JobDocument.builder()
                .hash("job-1")
                .actionId("action-id-1")
                .jobName("Test Job 1")
                .jobStatus(JobStatus.ACTIVE)
                .isScheduled(true)
                .build();

        JobDocument job2 = JobDocument.builder()
                .hash("job-2")
                .actionId("action-id-1")
                .jobName("Test Job 2")
                .jobStatus(JobStatus.ACTIVE)
                .isScheduled(false)
                .build();

        testJobs = List.of(job1, job2);
    }

    // ==================== Soft Delete Tests ====================

    @Test
    void testSoftDelete_Success() {
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));
        when(jobDocumentRepository.findJobByActionId("action-id-1")).thenReturn(testJobs);

        actionManagerService.softDelete("action-id-1");

        assertEquals(ActionStatus.DELETED, testAction.getActionStatus());
        assertEquals(ActionStatus.ACTIVE, testAction.getPreviousStatus());
        assertNotNull(testAction.getDeletedAt());
        
        verify(jobDocumentRepository).saveAll(any());
        verify(jobManagerService, times(2)).pause(anyString());
        verify(actionDocumentRepository).save(testAction);
    }

    @Test
    void testSoftDelete_AlreadyDeleted_ThrowsException() {
        testAction.setActionStatus(ActionStatus.DELETED);
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        InvalidArgumentException exception = assertThrows(
                InvalidArgumentException.class,
                () -> actionManagerService.softDelete("action-id-1")
        );

        assertTrue(exception.getMessage().contains("Action already deleted"));
        verify(jobDocumentRepository, never()).findJobByActionId(anyString());
    }

    @Test
    void testSoftDelete_ActionNotFound_ThrowsException() {
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> actionManagerService.softDelete("action-id-1")
        );
    }

    @Test
    void testSoftDelete_PausesAllJobs() {
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));
        when(jobDocumentRepository.findJobByActionId("action-id-1")).thenReturn(testJobs);

        actionManagerService.softDelete("action-id-1");

        // Verify all jobs are set to PAUSED
        testJobs.forEach(job -> assertEquals(JobStatus.PAUSED, job.getJobStatus()));
        verify(jobManagerService).pause("job-1");
        verify(jobManagerService).pause("job-2");
    }

    // ==================== Permanent Delete Tests ====================

    @Test
    void testPermanentDelete_Success() {
        testAction.setActionStatus(ActionStatus.DELETED);
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        actionManagerService.permanentDelete("action-id-1");

        verify(actionDocumentRepository).deleteById("action-id-1");
        verify(jobManagerService).deleteJobsByActionId("action-id-1");
        verify(actionManagerStatistics).removeActionStats("action-id-1");
    }

    @Test
    void testPermanentDelete_NotInDeletedStatus_ThrowsException() {
        testAction.setActionStatus(ActionStatus.ACTIVE);
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        InvalidArgumentException exception = assertThrows(
                InvalidArgumentException.class,
                () -> actionManagerService.permanentDelete("action-id-1")
        );

        assertTrue(exception.getMessage().contains("Action must be in DELETED status"));
        assertTrue(exception.getMessage().contains("ACTIVE"));
        verify(actionDocumentRepository, never()).deleteById(anyString());
    }

    @Test
    void testPermanentDelete_ArchivedStatus_ThrowsException() {
        testAction.setActionStatus(ActionStatus.ARCHIVED);
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        InvalidArgumentException exception = assertThrows(
                InvalidArgumentException.class,
                () -> actionManagerService.permanentDelete("action-id-1")
        );

        assertTrue(exception.getMessage().contains("Action must be in DELETED status"));
        verify(actionDocumentRepository, never()).deleteById(anyString());
    }

    @Test
    void testPermanentDelete_ActionNotFound_ThrowsException() {
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.empty());

        assertThrows(
                EntityNotFoundException.class,
                () -> actionManagerService.permanentDelete("action-id-1")
        );
    }

    // ==================== Restore Tests ====================

    @Test
    void testRestore_FromDeleted_Success() {
        testAction.setActionStatus(ActionStatus.DELETED);
        testAction.setPreviousStatus(ActionStatus.ACTIVE);
        testAction.setDeletedAt(System.currentTimeMillis() / 1000);
        
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));
        when(jobDocumentRepository.findJobByActionId("action-id-1")).thenReturn(testJobs);
        // Mock getJobDocument for each scheduled job
        when(jobManagerService.getJobDocument("job-1")).thenReturn(testJobs.get(0));
        when(jobResultDocumentRepository.findByJobId("job-1")).thenReturn(null);

        RestoreResponse response = actionManagerService.restore("action-id-1", null);

        assertEquals("action-id-1", response.getActionId());
        assertEquals(ActionStatus.ACTIVE, response.getActionStatus());
        assertEquals(ActionStatus.ACTIVE, testAction.getActionStatus());
        assertNull(testAction.getDeletedAt());
        assertNull(testAction.getPreviousStatus());
        
        verify(actionDocumentRepository).save(testAction);
    }

    @Test
    void testRestore_FromArchived_Success() {
        testAction.setActionStatus(ActionStatus.ARCHIVED);
        testAction.setPreviousStatus(ActionStatus.PAUSED);
        
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        RestoreResponse response = actionManagerService.restore("action-id-1", null);

        assertEquals("action-id-1", response.getActionId());
        assertEquals(ActionStatus.PAUSED, response.getActionStatus());
        assertEquals(ActionStatus.PAUSED, testAction.getActionStatus());
        assertNull(testAction.getPreviousStatus());
    }

    @Test
    void testRestore_WithTargetStatus_Success() {
        testAction.setActionStatus(ActionStatus.DELETED);
        testAction.setPreviousStatus(ActionStatus.ACTIVE);
        
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        RestoreResponse response = actionManagerService.restore("action-id-1", ActionStatus.PAUSED);

        assertEquals(ActionStatus.PAUSED, response.getActionStatus());
        assertEquals(ActionStatus.PAUSED, testAction.getActionStatus());
    }

    @Test
    void testRestore_NotInDeletedOrArchived_ThrowsException() {
        testAction.setActionStatus(ActionStatus.ACTIVE);
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        InvalidArgumentException exception = assertThrows(
                InvalidArgumentException.class,
                () -> actionManagerService.restore("action-id-1", null)
        );

        assertTrue(exception.getMessage().contains("Action must be in DELETED or ARCHIVED status"));
    }

    @Test
    void testRestore_NoPreviousStatus_DefaultsToActive() {
        testAction.setActionStatus(ActionStatus.DELETED);
        testAction.setPreviousStatus(null);
        
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));
        when(jobDocumentRepository.findJobByActionId("action-id-1")).thenReturn(testJobs);
        // Mock getJobDocument for scheduled jobs
        when(jobManagerService.getJobDocument("job-1")).thenReturn(testJobs.get(0));
        when(jobResultDocumentRepository.findByJobId("job-1")).thenReturn(null);

        RestoreResponse response = actionManagerService.restore("action-id-1", null);

        assertEquals(ActionStatus.ACTIVE, response.getActionStatus());
        assertEquals(ActionStatus.ACTIVE, testAction.getActionStatus());
    }

    @Test
    void testRestore_ToActive_ResumesScheduledJobs() {
        testAction.setActionStatus(ActionStatus.DELETED);
        testAction.setPreviousStatus(ActionStatus.ACTIVE);
        
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));
        when(jobDocumentRepository.findJobByActionId("action-id-1")).thenReturn(testJobs);
        // Mock getJobDocument for scheduled job
        when(jobManagerService.getJobDocument("job-1")).thenReturn(testJobs.get(0));
        when(jobResultDocumentRepository.findByJobId("job-1")).thenReturn(null);

        actionManagerService.restore("action-id-1", ActionStatus.ACTIVE);

        // Verify only scheduled jobs are resumed
        JobDocument scheduledJob = testJobs.get(0);
        assertEquals(JobStatus.ACTIVE, scheduledJob.getJobStatus());
        
        // Non-scheduled job should not be changed
        JobDocument nonScheduledJob = testJobs.get(1);
        assertEquals(JobStatus.ACTIVE, nonScheduledJob.getJobStatus());
        
        verify(jobDocumentRepository).saveAll(any());
    }

    @Test
    void testRestore_ToNonActiveStatus_DoesNotResumeJobs() {
        testAction.setActionStatus(ActionStatus.DELETED);
        testAction.setPreviousStatus(ActionStatus.PAUSED);
        
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));

        actionManagerService.restore("action-id-1", ActionStatus.PAUSED);

        // Verify jobs are not modified when restoring to non-ACTIVE status
        verify(jobDocumentRepository, never()).saveAll(any());
    }

    // ==================== Archive Tests (with previousStatus) ====================

    @Test
    void testArchive_StoresPreviousStatus() {
        when(actionDocumentRepository.findById("action-id-1")).thenReturn(Optional.of(testAction));
        when(jobDocumentRepository.findJobByActionId("action-id-1")).thenReturn(testJobs);

        actionManagerService.archive("action-id-1");

        assertEquals(ActionStatus.ARCHIVED, testAction.getActionStatus());
        assertEquals(ActionStatus.ACTIVE, testAction.getPreviousStatus());
        verify(actionDocumentRepository).save(testAction);
    }
}
