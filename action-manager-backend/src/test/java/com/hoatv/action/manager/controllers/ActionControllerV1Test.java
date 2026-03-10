package com.hoatv.action.manager.controllers;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.fwk.common.exceptions.EntityNotFoundException;
import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.repositories.ActionDocumentRepository;
import com.hoatv.action.manager.repositories.JobDocumentRepository;
import com.hoatv.action.manager.repositories.JobExecutionResultDocumentRepository;
import com.hoatv.action.manager.services.JobManagerStatistics;
import com.hoatv.fwk.common.ultilities.Pair;

@WebMvcTest(ActionControllerV1.class)
@ContextConfiguration(classes = TestConfig.class)
class ActionControllerV1Test {

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

    // --- POST /v1/actions ---
    @Test
    void testExecuteActionSuccess () throws Exception {
        ActionDefinitionDTO actionDefinitionDTO = getActionDefinitionDTO();
        Mockito.when(actionManagerService.create(any())).thenReturn("action-id");

        mockMvc.perform(post("/v1/actions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(actionDefinitionDTO)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.actionId").value("action-id"));
    }

    @Test
    void testExecuteActionFailure () throws Exception {
        Mockito.when(actionManagerService.create(any())).thenThrow(new RuntimeException("Unexpected error"));
        mockMvc.perform(post("/v1/actions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(getActionDefinitionDTO())))
               .andExpect(status().isInternalServerError());
    }

    // --- POST /v1/actions/{actionId}/jobs ---
    @Test
    void testAddNewJobsSuccess () throws Exception {
        Mockito.when(actionManagerService.addJobsToAction(eq("a1"), anyList())).thenReturn("a1");

        mockMvc.perform(post("/v1/actions/a1/jobs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(List.of(getJobDefinitionDTO()))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.actionId").value("a1"));
    }

    @Test
    void testAddNewJobsFailure () throws Exception {
        Mockito.when(actionManagerService.addJobsToAction(anyString(), anyList()))
               .thenThrow(new RuntimeException("Unexpected error"));
        mockMvc.perform(post("/v1/actions/a1/jobs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(List.of(new JobDefinitionDTO()))))
               .andExpect(status().isInternalServerError());
    }

    // --- GET /v1/actions ---
    @Test
    void testGetActionsSuccess () throws Exception {
        Mockito.when(actionManagerService.getActions(anyList(), any()))
               .thenReturn(new PageImpl<>(List.of(new ActionOverviewDTO())));
        mockMvc.perform(get("/v1/actions")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isOk());
    }

    @Test
    void testGetActionsFailure () throws Exception {
        Mockito.when(actionManagerService.getActions(anyList(), any())).thenThrow(new RuntimeException());
        mockMvc.perform(get("/v1/actions")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isInternalServerError());
    }

    // --- GET /v1/actions/trash ---
    @Test
    void testGetActionInTrashSuccess () throws Exception {
        Mockito.when(actionManagerService.getActions(anyList(), any()))
               .thenReturn(new PageImpl<>(List.of(new ActionOverviewDTO())));
        mockMvc.perform(get("/v1/actions/trash")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isOk());
    }

    @Test
    void testGetActionInTrashFailure () throws Exception {
        Mockito.when(actionManagerService.getActions(anyList(), any())).thenThrow(new RuntimeException());
        mockMvc.perform(get("/v1/actions/trash")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isInternalServerError());
    }

    // --- GET /v1/actions/{actionId} ---
    @Test
    void testGetActionDetailSuccess () throws Exception {
        Mockito.when(actionManagerService.getActionById("a1")).thenReturn(Optional.of(getActionDefinitionDTO()));
        mockMvc.perform(get("/v1/actions/a1"))
               .andExpect(status().isOk());
    }

    @Test
    void testGetActionDetailNotFound () throws Exception {
        Mockito.when(actionManagerService.getActionById("a1")).thenReturn(Optional.empty());
        mockMvc.perform(get("/v1/actions/a1"))
               .andExpect(status().isNotFound());
    }

    @Test
    void testGetActionDetailFailure () throws Exception {
        Mockito.when(actionManagerService.getActionById("a1")).thenThrow(new RuntimeException());
        mockMvc.perform(get("/v1/actions/a1"))
               .andExpect(status().isInternalServerError());
    }

    // --- PATCH /v1/actions/{actionId}/favorite ---
    @Test
    void testSetFavoriteActionValueSuccess () throws Exception {
        Mockito.when(actionManagerService.setFavorite(eq("a1"), eq(true)))
               .thenReturn(getActionDefinitionDTO());
        mockMvc.perform(patch("/v1/actions/a1/favorite").param("isFavorite", "true"))
               .andExpect(status().isOk());
    }

    @Test
    void testSetFavoriteActionValueFailure () throws Exception {
        Mockito.when(actionManagerService.setFavorite(any(), anyBoolean())).thenThrow(new RuntimeException());
        mockMvc.perform(patch("/v1/actions/a1/favorite").param("isFavorite", "true"))
               .andExpect(status().isInternalServerError());
    }

    // --- POST /v1/actions/{actionId}/replays ---
    @Test
    void testReplayActionSuccess () throws Exception {
        Mockito.when(actionManagerService.replay("a1")).thenReturn(true);
        mockMvc.perform(post("/v1/actions/a1/replays"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.status").value(true));
    }

    @Test
    void testReplayActionFailure () throws Exception {
        Mockito.when(actionManagerService.replay(anyString())).thenThrow(new RuntimeException());
        mockMvc.perform(post("/v1/actions/a1/replays"))
               .andExpect(status().isInternalServerError());
    }

    // --- POST /v1/actions/{actionId}/failure-replays ---
    @Test
    void testReplayFailuresSuccess () throws Exception {
        Mockito.when(actionManagerService.replayFailure("a1")).thenReturn(false);
        mockMvc.perform(post("/v1/actions/a1/failure-replays"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.status").value(false));
    }

    @Test
    void testReplayFailuresFailure () throws Exception {
        Mockito.when(actionManagerService.replayFailure(anyString())).thenThrow(new RuntimeException());
        mockMvc.perform(post("/v1/actions/a1/failure-replays"))
               .andExpect(status().isInternalServerError());
    }

    // --- POST /v1/actions/{actionId}/jobs/{jobId}/replays ---
    @Test
    void testReplayJobSuccess () throws Exception {
        Mockito.when(actionManagerService.replayJob(anyString(), anyString())).thenReturn(true);
        mockMvc.perform(post("/v1/actions/a1/jobs/j1/replays"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.status").value(true));
    }

    @Test
    void testReplayJobFailure () throws Exception {
        Mockito.when(actionManagerService.replayJob(anyString(), anyString())).thenThrow(new RuntimeException());
        mockMvc.perform(post("/v1/actions/a1/jobs/j1/replays"))
               .andExpect(status().isInternalServerError());
    }

    // --- DELETE /v1/actions/{actionId} ---
    // --- DELETE /v1/actions/{actionId} ---
    @Test
    void testDeleteActionSuccess () throws Exception {
        Mockito.doNothing().when(actionManagerService).softDelete("a1");
        mockMvc.perform(delete("/v1/actions/a1"))
               .andExpect(status().isNoContent());
    }

    @Test
    void testDeleteActionNotFound () throws Exception {
        Mockito.doThrow(new EntityNotFoundException("Cannot find action ID: a1"))
               .when(actionManagerService).softDelete("a1");
        mockMvc.perform(delete("/v1/actions/a1"))
               .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteActionFailure () throws Exception {
        Mockito.doThrow(new RuntimeException("Unexpected error"))
               .when(actionManagerService).softDelete("a1");
        mockMvc.perform(delete("/v1/actions/a1"))
               .andExpect(status().isInternalServerError());
    }

    // --- GET /v1/actions/search ---
    @Test
    void testSearchActionsSuccess () throws Exception {
        Mockito.when(actionManagerService.search(anyString(), any()))
               .thenReturn(new PageImpl<>(List.of(new ActionOverviewDTO())));
        mockMvc.perform(get("/v1/actions/search")
                            .param("search", "q")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isOk());
    }

    @Test
    void testSearchActionsFailure () throws Exception {
        Mockito.when(actionManagerService.search(anyString(), any())).thenThrow(new RuntimeException());
        mockMvc.perform(get("/v1/actions/search")
                            .param("search", "q")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isInternalServerError());
    }

    // --- GET /v1/actions/{actionId}/jobs ---
    @Test
    void testGetJobsFromActionSuccess () throws Exception {
        Mockito.when(jobManagerService.getJobsFromAction(anyString(), any(PageRequest.class), eq(null)))
               .thenReturn(new PageImpl<>(List.of(new JobOverviewDTO())));
        mockMvc.perform(get("/v1/actions/a1/jobs")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isOk());
    }

    @Test
    void testGetJobsFromActionWithSearchSuccess () throws Exception {
        Mockito.when(jobManagerService.getJobsFromAction(eq("a1"), any(PageRequest.class), eq("test")))
               .thenReturn(new PageImpl<>(List.of(new JobOverviewDTO())));
        mockMvc.perform(get("/v1/actions/a1/jobs")
                            .param("pageIndex", "0")
                            .param("pageSize", "10")
                            .param("searchText", "test"))
               .andExpect(status().isOk());
    }

    @Test
    void testGetJobsFromActionFailure () throws Exception {
        Mockito.when(jobManagerService.getJobsFromAction(anyString(), any(PageRequest.class), any())).thenThrow(
            new RuntimeException());
        mockMvc.perform(get("/v1/actions/a1/jobs")
                            .param("pageIndex", "0")
                            .param("pageSize", "10"))
               .andExpect(status().isInternalServerError());
    }

    @Test
    void testUpdateSuccess () throws Exception {
        mockMvc.perform(put("/v1/actions/a1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(getActionDefinitionDTO())))
               .andExpect(status().isNoContent());
    }

    @Test
    void testUpdateFailure () throws Exception {
        Mockito.doThrow(new RuntimeException()).when(actionManagerService).update(anyString(), any());
        mockMvc.perform(put("/v1/actions/a1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(getActionDefinitionDTO())))
               .andExpect(status().isInternalServerError());
    }

    // --- POST /v1/actions/validations ---
    @Test
    void testDryRunSuccess () throws Exception {
        mockMvc.perform(post("/v1/actions/validations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(getActionDefinitionDTO())))
               .andExpect(status().isNoContent());
    }

    private JobDefinitionDTO getJobDefinitionDTO () {
        JobDefinitionDTO job = new JobDefinitionDTO();
        job.setJobName("Job 1");
        job.setConfigurations("{}");
        job.setJobContent("content");
        return job;
    }

    private ActionDefinitionDTO getActionDefinitionDTO () {
        ActionDefinitionDTO actionDefinitionDTO = new ActionDefinitionDTO();
        actionDefinitionDTO.setActionName("Sample Action");
        actionDefinitionDTO.setActionStatus("ACTIVE");
        actionDefinitionDTO.setConfigurations("{}");
        actionDefinitionDTO.setJobs(List.of(getJobDefinitionDTO()));
        return actionDefinitionDTO;
    }

    @Test
    void testDryRunFailure () throws Exception {
        Mockito.doThrow(new RuntimeException()).when(actionManagerService).dryRun(any());
        mockMvc.perform(post("/v1/actions/validations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(getActionDefinitionDTO())))
               .andExpect(status().isInternalServerError());
    }

    // --- PUT /v1/actions/{actionId}/archive ---
    @Test
    void testArchiveSuccess () throws Exception {
        mockMvc.perform(put("/v1/actions/a1/archive"))
               .andExpect(status().isNoContent());
    }

    @Test
    void testArchiveFailure () throws Exception {
        Mockito.doThrow(new RuntimeException()).when(actionManagerService).archive(any());
        mockMvc.perform(put("/v1/actions/a1/archive"))
               .andExpect(status().isInternalServerError());
    }

    // --- PUT /v1/actions/{actionId}/restore ---
    @Test
    void testRestoreSuccess () throws Exception {
        mockMvc.perform(put("/v1/actions/a1/restore"))
               .andExpect(status().isOk());
    }

    @Test
    void testRestoreFailure () throws Exception {
        Mockito.doThrow(new EntityNotFoundException("Action not found")).when(actionManagerService).restore(any(), any());
        mockMvc.perform(put("/v1/actions/a1/restore"))
               .andExpect(status().isNotFound());
    }

    // --- DELETE /v1/actions/{actionId} (soft delete) ---
    @Test
    void testSoftDeleteActionSuccess() throws Exception {
        Mockito.doNothing().when(actionManagerService).softDelete("a1");
        
        mockMvc.perform(delete("/v1/actions/a1"))
               .andExpect(status().isNoContent());
    }

    @Test
    void testSoftDeleteActionAlreadyDeleted() throws Exception {
        Mockito.doThrow(new com.hoatv.fwk.common.exceptions.InvalidArgumentException("Action already deleted"))
               .when(actionManagerService).softDelete("a1");
        
        mockMvc.perform(delete("/v1/actions/a1"))
               .andExpect(status().isBadRequest());
    }

    @Test
    void testSoftDeleteActionNotFound() throws Exception {
        Mockito.doThrow(new com.hoatv.fwk.common.exceptions.EntityNotFoundException("Cannot find action ID: a1"))
               .when(actionManagerService).softDelete("a1");
        
        mockMvc.perform(delete("/v1/actions/a1"))
               .andExpect(status().isNotFound());
    }

    // --- DELETE /v1/actions/{actionId}?permanent=true ---
    @Test
    void testPermanentDeleteActionSuccess() throws Exception {
        Mockito.doNothing().when(actionManagerService).permanentDelete("a1");
        
        mockMvc.perform(delete("/v1/actions/a1").param("permanent", "true"))
               .andExpect(status().isNoContent());
    }

    @Test
    void testPermanentDeleteActionNotInDeletedStatus() throws Exception {
        Mockito.doThrow(new com.hoatv.fwk.common.exceptions.InvalidArgumentException(
                "Action must be in DELETED status before permanent deletion. Current status: ACTIVE"))
               .when(actionManagerService).permanentDelete("a1");
        
        mockMvc.perform(delete("/v1/actions/a1").param("permanent", "true"))
               .andExpect(status().isBadRequest());
    }

    @Test
    void testPermanentDeleteActionNotFound() throws Exception {
        Mockito.doThrow(new com.hoatv.fwk.common.exceptions.EntityNotFoundException("Cannot find action ID: a1"))
               .when(actionManagerService).permanentDelete("a1");
        
        mockMvc.perform(delete("/v1/actions/a1").param("permanent", "true"))
               .andExpect(status().isNotFound());
    }

    // --- PUT /v1/actions/{actionId}/restore (Enhanced) ---
    @Test
    void testRestoreActionWithTargetStatusSuccess() throws Exception {
        com.hoatv.action.manager.dtos.RestoreResponse response = com.hoatv.action.manager.dtos.RestoreResponse.builder()
                .actionId("a1")
                .actionStatus(com.hoatv.action.manager.collections.ActionStatus.ACTIVE)
                .restoredAt(System.currentTimeMillis() / 1000)
                .message("Action restored successfully")
                .build();
        
        Mockito.when(actionManagerService.restore(eq("a1"), eq(com.hoatv.action.manager.collections.ActionStatus.ACTIVE)))
               .thenReturn(response);
        
        String requestBody = "{\"targetStatus\":\"ACTIVE\"}";
        mockMvc.perform(put("/v1/actions/a1/restore")
                       .contentType(MediaType.APPLICATION_JSON)
                       .content(requestBody))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.actionId").value("a1"))
               .andExpect(jsonPath("$.actionStatus").value("ACTIVE"))
               .andExpect(jsonPath("$.restoredAt").exists())
               .andExpect(jsonPath("$.message").value("Action restored successfully"));
    }

    @Test
    void testRestoreActionWithoutTargetStatusSuccess() throws Exception {
        com.hoatv.action.manager.dtos.RestoreResponse response = com.hoatv.action.manager.dtos.RestoreResponse.builder()
                .actionId("a1")
                .actionStatus(com.hoatv.action.manager.collections.ActionStatus.ACTIVE)
                .restoredAt(System.currentTimeMillis() / 1000)
                .message("Action restored successfully")
                .build();
        
        Mockito.when(actionManagerService.restore(eq("a1"), eq(null)))
               .thenReturn(response);
        
        mockMvc.perform(put("/v1/actions/a1/restore"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.actionId").value("a1"))
               .andExpect(jsonPath("$.actionStatus").value("ACTIVE"));
    }

    @Test
    void testRestoreActionNotInDeletedOrArchivedStatus() throws Exception {
        Mockito.when(actionManagerService.restore(eq("a1"), any()))
               .thenThrow(new com.hoatv.fwk.common.exceptions.InvalidArgumentException(
                       "Action must be in DELETED or ARCHIVED status to restore. Current status: ACTIVE"));
        
        mockMvc.perform(put("/v1/actions/a1/restore"))
               .andExpect(status().isBadRequest());
    }

    // --- PUT /v1/actions/{actionId}/jobs/{jobHash}/resume ---
    @Test
    void testResumeJobSuccess () throws Exception {
        mockMvc.perform(put("/v1/actions/a1/jobs/j1/resume"))
               .andExpect(status().isNoContent());
    }

    @Test
    void testResumeJobFailure () throws Exception {
        Mockito.doThrow(new RuntimeException()).when(actionManagerService).resume(any());
        mockMvc.perform(put("/v1/actions/a1/jobs/j1/resume"))
               .andExpect(status().isInternalServerError());
    }

    // --- GET /v1/actions/{actionId}/export ---
    @Test
    void testExportSuccess () throws Exception {
        Pair<String, byte[]> pair = Pair.of("fileExport", new byte[] { 1, 2, 3 });
        Mockito.when(actionManagerService.export(eq("a1"), any())).thenReturn(pair);

        mockMvc.perform(get("/v1/actions/a1/export"))
               .andExpect(status().isOk())
               .andExpect(header().string("Content-Disposition", containsString("fileExport-")))
               .andExpect(header().string("Content-Type", "application/octet-stream"));
    }

    @Test
    void testExportFailure () throws Exception {
        Mockito.when(actionManagerService.export(anyString(), any())).thenThrow(new RuntimeException());
        mockMvc.perform(get("/v1/actions/a1/export"))
               .andExpect(status().isInternalServerError());
    }

    // --- POST /v1/actions/import ---
    @Test
    void testImportActionSuccess () throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "filename.txt", "text/plain", "test content".getBytes());
        Mockito.when(actionManagerService.importAction(any())).thenReturn("importedName");

        mockMvc.perform(multipart("/v1/actions/import").file(file))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.name").value("importedName"));
    }

    @Test
    void testImportActionFailure () throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "filename.txt", "text/plain", "test content".getBytes());
        Mockito.when(actionManagerService.importAction(any())).thenThrow(new RuntimeException());
        mockMvc.perform(multipart("/v1/actions/import").file(file))
               .andExpect(status().isInternalServerError());
    }
}