package com.hoatv.action.manager.controllers;


import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.fwk.common.ultilities.Pair;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value = "/v1/actions", produces = MediaType.APPLICATION_JSON_VALUE)
public class ActionControllerV1 {

    public static final String ACTION_CREATED_AT_PROP = "createdAt";

    private final ActionManagerService actionManagerService;

    private final JobManagerService jobManagerService;

    public ActionControllerV1(ActionManagerService actionManagerService, JobManagerService jobManagerService) {
        this.actionManagerService = actionManagerService;
        this.jobManagerService = jobManagerService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> executeAction(@RequestBody @Valid ActionDefinitionDTO actionDefinition) {
        String actionId = actionManagerService.create(actionDefinition);
        return ResponseEntity.ok(Map.of("actionId", actionId));
    }

    @PostMapping(value = "/{actionId}/jobs/new", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> addNewJobs(@PathVariable("actionId") String hash,
                                        @RequestBody @Valid List<JobDefinitionDTO> jobDefinitionDTOs) {
        String actionId = actionManagerService.addJobsToAction(hash, jobDefinitionDTOs);
        return ResponseEntity.ok(Map.of("actionId", actionId));
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getActions(
            @RequestParam("pageIndex") @Min(0) int pageIndex,
            @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("isFavorite"), Sort.Order.desc(ACTION_CREATED_AT_PROP));
        List<ActionStatus> statuses = List.of(
                ActionStatus.INITIAL, ActionStatus.PAUSED, ActionStatus.ACTIVE);
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.getActions(statuses, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @GetMapping(value = "/trash", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getActionInTrash(
            @RequestParam("pageIndex") @Min(0) int pageIndex,
            @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("createdAt"));
        List<ActionStatus> statuses = List.of(ActionStatus.ARCHIVED);
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.getActions(statuses, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @GetMapping(value = "/{actionId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getActionDetail(@PathVariable("actionId") String hash) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.getActionById(hash);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        return ResponseEntity.ok(actionDefinitionDTO);
    }

    @PatchMapping(value = "/{actionId}/favorite", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> setFavoriteActionValue(@PathVariable("actionId") String hash,
                                                    @RequestParam("isFavorite") boolean isFavorite) {
        ActionDefinitionDTO actionResult = actionManagerService.setFavorite(hash, isFavorite);
        return ResponseEntity.ok(actionResult);
    }

    @GetMapping(value = "/{actionId}/replay", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> replayAction(@PathVariable("actionId") String hash) {
        boolean isReplaySuccess = actionManagerService.replay(hash);
        return ResponseEntity.ok(Map.of("status", isReplaySuccess));
    }

    @DeleteMapping(value = "/{actionId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteAction(@PathVariable("actionId") String hash) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.getActionById(hash);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        actionManagerService.delete(actionDefinitionDTO.getHash());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getActions(@RequestParam("search") String search,
                                        @RequestParam("pageIndex") @Min(0) int pageIndex,
                                        @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("isFavorite"), Sort.Order.desc("createdAt"));
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.search(search, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @GetMapping(value = "/{actionId}/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getJobsFromAction(@PathVariable("actionId") String actionId,
                                               @RequestParam("pageIndex") @Min(0) int pageIndex,
                                               @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("createdAt"));
        Page<JobOverviewDTO> actionResults =
                jobManagerService.getJobsFromAction(actionId, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }
    @PutMapping(path = "/{actionId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> update(@PathVariable("actionId") String actionId, @RequestBody ActionDefinitionDTO actionDefinitionDTO) {
        actionManagerService.update(actionId, actionDefinitionDTO);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/dryRun", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> dryRun(@RequestBody @Valid ActionDefinitionDTO actionDefinition) {
        actionManagerService.dryRun(actionDefinition);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{actionId}/archive", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> archive(@PathVariable("actionId") String actionId) {
        actionManagerService.archive(actionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{actionId}/restore", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> restore(@PathVariable("actionId") String actionId) {
        actionManagerService.restore(actionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{actionId}/jobs/{jobHash}/resume", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> resumeJob(@PathVariable("actionId") String actionId, @PathVariable("jobHash") String jobId) {
        actionManagerService.resume(jobId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(path = "/{actionId}/export")
    public ResponseEntity<Object> export(@PathVariable("actionId") String actionId, HttpServletResponse response) throws IOException {
        Pair<String, byte[]> outputStreamPair = actionManagerService.export(actionId, response.getOutputStream());
        LocalDate localDate = LocalDate.now();
        String fileName = outputStreamPair.getKey().concat("-").concat(localDate.format(DateTimeFormatter.ISO_DATE));
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment;filename=\"" + fileName + ".zip\"")
                .header("Content-Type", "application/octet-stream")
                .body(outputStreamPair.getValue());
    }

    @PostMapping(path = "/import", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> importAction(@RequestParam(value = "file", required = true) Object multipartFile) throws IOException {
        String actionName = actionManagerService.importAction((MultipartFile) multipartFile);
        return ResponseEntity.ok(Map.of("name", actionName));
    }
}
