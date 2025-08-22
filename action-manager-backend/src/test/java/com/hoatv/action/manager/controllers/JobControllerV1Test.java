package com.hoatv.action.manager.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.fwk.common.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.action.manager.services.JobManagerStatistics;

@WebMvcTest(ActionControllerV1.class)
@ContextConfiguration(classes = com.hoatv.action.manager.ActionManagerApplication.class)
class JobControllerV1Test {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MongoDatabaseFactory mongoDatabaseFactory;

    @MockBean
    private ActionManagerService actionManagerService;

    @MockBean
    private ActionDocumentRepository actionDocumentRepository;

    @MockBean
    private JobExecutionResultDocumentRepository jobExecutionResultDocumentRepository;

    @MockBean
    private JobDocumentRepository jobDocumentRepository;
    @MockBean
    private JobManagerService     jobManagerService;

    @MockBean
    private JobManagerStatistics jobManagerStatistics;

    @Autowired
    private ObjectMapper objectMapper;

    private JobDefinitionDTO getJobDefinitionDTO() {
        JobDefinitionDTO job = new JobDefinitionDTO();
        job.setJobName("Job 1");
        job.setConfigurations("{}");
        job.setJobContent("content");
        return job;
    }

    @Test
    void testGetJobsReturnsOkWhenSuccess() throws Exception {
        Page<JobOverviewDTO> page = new PageImpl<>(List.of(new JobOverviewDTO()));
        Mockito.when(jobManagerService.getOverviewJobs(Mockito.any()))
               .thenReturn(page);

        mockMvc.perform(get("/v1/jobs")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isOk());
    }

    @Test
    void testUpdateJobReturnsOkWhenValidInput() throws Exception {
        JobDefinitionDTO job = getJobDefinitionDTO();
        String jobId = "job-1";

        mockMvc.perform(put("/v1/jobs/{jobId}", jobId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(job)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.uuid").value(jobId));

        Mockito.verify(jobManagerService).update(Mockito.eq(jobId), Mockito.any());
    }

    @Test
    void testUpdateJobReturnsBadRequestWhenInvalidInput() throws Exception {
        JobDefinitionDTO job = new JobDefinitionDTO();
        String jobId = "job-1";

        mockMvc.perform(put("/v1/jobs/{jobId}", jobId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(job)))
               .andExpect(status().isBadRequest());
    }

    @Test
    void testGetJobByIdReturnsOkWhenJobExists() throws Exception {
        String jobId = "job-1";
        JobDetailDTO detail = new JobDetailDTO();
        Mockito.when(jobManagerService.getJobDetails(jobId)).thenReturn(detail);

        mockMvc.perform(get("/v1/jobs/{jobId}", jobId))
               .andExpect(status().isOk());
    }

    @Test
    void testGetJobByIdReturnsNotFoundWhenJobDoesNotExist() throws Exception {
        String jobId = "job-1";
        Mockito.when(jobManagerService.getJobDetails(jobId))
               .thenThrow(new EntityNotFoundException("Job not found"));

        mockMvc.perform(get("/v1/jobs/{jobId}", jobId))
               .andExpect(status().isNotFound());
    }

    @Test
    void testDryRunReturnsNoContentWhenValidInput() throws Exception {
        JobDefinitionDTO job = getJobDefinitionDTO();
        String actionId = "action1";
        ActionDefinitionDTO action = new ActionDefinitionDTO();
        Mockito.when(actionManagerService.getActionById(actionId)).thenReturn(Optional.of(action));

        mockMvc.perform(post("/v1/jobs/dryRun")
                            .param("actionId", actionId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(job)))
               .andExpect(status().isNoContent());

        Mockito.verify(jobManagerService).processNonePersistenceJob(Mockito.any(), Mockito.any());
    }

    @Test
    void testDryRunReturnsServerErrorWhenActionNotFound() throws Exception {
        JobDefinitionDTO job = getJobDefinitionDTO();
        String actionId = "action1";
        Mockito.when(actionManagerService.getActionById(actionId)).thenReturn(Optional.empty());

        mockMvc.perform(post("/v1/jobs/dryRun")
                            .param("actionId", actionId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(job)))
               .andExpect(status().isInternalServerError());
    }

    @Test
    void testDryRunReturnsBadRequestWhenInvalidJobDefinition() throws Exception {
        JobDefinitionDTO job = new JobDefinitionDTO();
        String actionId = "action1";
        Mockito.when(actionManagerService.getActionById(actionId)).thenReturn(Optional.of(new ActionDefinitionDTO()));

        mockMvc.perform(post("/v1/jobs/dryRun")
                            .param("actionId", actionId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(job)))
               .andExpect(status().isBadRequest());
    }

    @Test
    void testPauseJobReturnsNoContentWhenJobExists() throws Exception {
        String jobId = "job-1";
        mockMvc.perform(put("/v1/jobs/{jobId}/pause", jobId))
               .andExpect(status().isNoContent());
        Mockito.verify(jobManagerService).pause(jobId);
    }

    @Test
    void testPauseJobReturnsNotFoundWhenJobDoesNotExist() throws Exception {
        String jobId = "job-1";
        Mockito.doThrow(new EntityNotFoundException("Job not found")).when(jobManagerService).pause(jobId);

        mockMvc.perform(put("/v1/jobs/{jobId}/pause", jobId))
               .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteJobReturnsNoContentWhenJobExists() throws Exception {
        String jobId = "job-1";
        mockMvc.perform(delete("/v1/jobs/{jobId}", jobId))
               .andExpect(status().isNoContent());
        Mockito.verify(jobManagerService).delete(jobId);
    }

    @Test
    void testDeleteJobReturnsNotFoundWhenJobDoesNotExist() throws Exception {
        String jobId = "job-1";
        Mockito.doThrow(new EntityNotFoundException("Job not found")).when(jobManagerService).delete(jobId);

        mockMvc.perform(delete("/v1/jobs/{jobId}", jobId))
               .andExpect(status().isNotFound());
    }
}