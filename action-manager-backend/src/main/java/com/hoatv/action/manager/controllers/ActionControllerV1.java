package com.hoatv.action.manager.controllers;


import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import com.hoatv.monitor.mgmt.LoggingMonitor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value = "/v1/actions", produces = MediaType.APPLICATION_JSON_VALUE)
public class ActionControllerV1 {

    private final ActionManagerService actionManagerService;
    private final JobManagerService jobManagerService;

    public ActionControllerV1(ActionManagerService actionManagerService, JobManagerService jobManagerService) {
        this.actionManagerService = actionManagerService;
        this.jobManagerService = jobManagerService;
    }

    @LoggingMonitor
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> executeAction(@RequestBody @Valid ActionDefinitionDTO actionDefinition) {
        String actionId = actionManagerService.processAction(actionDefinition);
        return ResponseEntity.ok(Map.of("actionId", actionId));
    }

    @LoggingMonitor
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllActionsWithPaging(
            @RequestParam("pageIndex") @Min(0) int pageIndex,
            @RequestParam("pageSize") @Min(0) int pageSize) {
        Sort defaultSorting = Sort.by(Sort.Order.desc("isFavorite"), Sort.Order.desc("createdAt"));
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.getAllActionsWithPaging(PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @LoggingMonitor
    @GetMapping(value = "/{hash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getActionDetail(@PathVariable("hash") String hash) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.getActionById(hash);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        return ResponseEntity.ok(actionDefinitionDTO);
    }

    @LoggingMonitor
    @PatchMapping(value = "/{hash}/favorite", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> setFavoriteActionValue(@PathVariable("hash") String hash,
                                               @RequestParam("isFavorite") boolean isFavorite) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.setFavoriteActionValue(hash, isFavorite);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        return ResponseEntity.ok(actionDefinitionDTO);
    }

    @LoggingMonitor
    @GetMapping(value = "/{hash}/replay", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> replayAction(@PathVariable("hash") String hash) {
        boolean isReplaySuccess = actionManagerService.replayAction(hash);
        return ResponseEntity.ok(Map.of("status", isReplaySuccess));
    }

    @LoggingMonitor
    @DeleteMapping(value = "/{hash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteAction(@PathVariable("hash") String hash) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.getActionById(hash);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        actionManagerService.deleteAction(actionDefinitionDTO.getHash());
        return ResponseEntity.noContent().build();
    }

    @LoggingMonitor
    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getActions(@RequestParam("search") String search,
                                        @RequestParam("pageIndex") @Min(0) int pageIndex,
                                        @RequestParam("pageSize") @Min(0) int pageSize) {
        Sort defaultSorting = Sort.by(Sort.Order.desc("isFavorite"), Sort.Order.desc("createdAt"));
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.getAllActionsWithPaging(search, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }
    @LoggingMonitor
    @GetMapping(value = "/{hash}/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getJobsFromAction(@PathVariable("hash") String actionId,
                                               @RequestParam("pageIndex") @Min(0) int pageIndex,
                                               @RequestParam("pageSize") @Min(0) int pageSize) {
        Sort defaultSorting = Sort.by(Sort.Order.desc("createdAt"));
        Page<JobOverviewDTO> actionResults =
                jobManagerService.getJobsFromAction(actionId, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }
}
