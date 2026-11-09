package com.hoatv.action.manager.document.transformers;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobExecutionStatus;
import com.hoatv.action.manager.collections.JobResultDocument;
import com.hoatv.action.manager.collections.JobState;
import com.hoatv.action.manager.collections.JobStatus;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class JobTransformerTest {

    @Test
    void testGetJobOverviewDTOsWhenJobResultDocumentIsEmpty() {
        JobDocument jobDocument = JobDocument.builder()
                .hash("job-hash-1")
                .jobName("test-job")
                .actionId("action-1")
                .jobStatus(JobStatus.INITIAL)
                .isScheduled(true)
                .build();
        Page<JobDocument> jobDocuments = new PageImpl<>(List.of(jobDocument), PageRequest.of(0, 10), 1);

        Page<JobOverviewDTO> result = JobTransformer.getJobOverviewDTOs(jobDocuments, Collections.emptyList());

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        JobOverviewDTO dto = result.getContent().get(0);
        assertNotNull(dto);
        assertEquals("test-job", dto.getName());
        assertEquals("job-hash-1", dto.getHash());
        assertEquals("INITIAL", dto.getStatus());
        assertEquals("", dto.getJobState());
        assertEquals("", dto.getJobExecutionStatus());
        assertEquals("", dto.getElapsedTime());
    }

    @Test
    void testGetJobOverviewDTOsWhenJobResultDocumentPresent() {
        JobDocument jobDocument = JobDocument.builder()
                .hash("job-hash-2")
                .jobName("test-job-2")
                .actionId("action-2")
                .jobStatus(JobStatus.ACTIVE)
                .isScheduled(false)
                .build();
        JobResultDocument resultDoc = JobResultDocument.builder()
                .jobId("job-hash-2")
                .jobState(JobState.INITIAL)
                .jobExecutionStatus(JobExecutionStatus.SUCCESS)
                .elapsedTime(1500L)
                .build();
        Page<JobDocument> jobDocuments = new PageImpl<>(List.of(jobDocument), PageRequest.of(0, 10), 1);

        Page<JobOverviewDTO> result = JobTransformer.getJobOverviewDTOs(jobDocuments, List.of(resultDoc));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        JobOverviewDTO dto = result.getContent().get(0);
        assertNotNull(dto);
        assertEquals("test-job-2", dto.getName());
        assertEquals("ACTIVE", dto.getStatus());
        assertEquals("INITIAL", dto.getJobState());
        assertEquals("SUCCESS", dto.getJobExecutionStatus());
    }
}
