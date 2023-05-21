package com.hoatv.action.manager.controllers;


import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.exceptions.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/v1/actions", produces = MediaType.APPLICATION_JSON_VALUE)
public class ActionControllerV1 {

    private final ActionManagerService actionManagerService;
    private final JobManagerService jobManagerService;

    public ActionControllerV1(ActionManagerService actionManagerService, JobManagerService jobManagerService) {
        this.actionManagerService = actionManagerService;
        this.jobManagerService = jobManagerService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> executeAction(@RequestBody @Valid ActionDefinitionDTO actionDefinition) {
        String actionId = actionManagerService.processAction(actionDefinition);
        return ResponseEntity.ok(Map.of("actionId", actionId));
    }

    @PostMapping(value = "/{hash}/jobs/new", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addNewJobs(@PathVariable("hash") String hash,
                                        @RequestBody @Valid List<JobDefinitionDTO> jobDefinitionDTOs) {
        String actionId = actionManagerService.addJobsToAction(hash, jobDefinitionDTOs);
        return ResponseEntity.ok(Map.of("actionId", actionId));
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllActionsWithPaging(
            @RequestParam("pageIndex") @Min(0) int pageIndex,
            @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("isFavorite"), Sort.Order.desc("createdAt"));
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.getAllActionsWithPaging(PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @GetMapping(value = "/{hash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getActionDetail(@PathVariable("hash") String hash) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.getActionById(hash);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        return ResponseEntity.ok(actionDefinitionDTO);
    }

    @PatchMapping(value = "/{hash}/favorite", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> setFavoriteActionValue(@PathVariable("hash") String hash,
                                                    @RequestParam("isFavorite") boolean isFavorite) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.setFavoriteActionValue(hash, isFavorite);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        return ResponseEntity.ok(actionDefinitionDTO);
    }

    @GetMapping(value = "/{hash}/replay", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> replayAction(@PathVariable("hash") String hash) {
        boolean isReplaySuccess = actionManagerService.replayAction(hash);
        return ResponseEntity.ok(Map.of("status", isReplaySuccess));
    }

    @DeleteMapping(value = "/{hash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteAction(@PathVariable("hash") String hash) {
        Optional<ActionDefinitionDTO> actionResult = actionManagerService.getActionById(hash);
        ActionDefinitionDTO actionDefinitionDTO = actionResult
                .orElseThrow(() -> new EntityNotFoundException("Cannot find action ID: " + hash));
        actionManagerService.deleteAction(actionDefinitionDTO.getHash());
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getActions(@RequestParam("search") String search,
                                        @RequestParam("pageIndex") @Min(0) int pageIndex,
                                        @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("isFavorite"), Sort.Order.desc("createdAt"));
        Page<ActionOverviewDTO> actionResults =
                actionManagerService.getAllActionsWithPaging(search, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @GetMapping(value = "/{hash}/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getJobsFromAction(@PathVariable("hash") String actionId,
                                               @RequestParam("pageIndex") @Min(0) int pageIndex,
                                               @RequestParam("pageSize") @Min(0) int pageSize) {

        Sort defaultSorting = Sort.by(Sort.Order.desc("createdAt"));
        Page<JobOverviewDTO> actionResults =
                jobManagerService.getJobsFromAction(actionId, PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @PostMapping(path = "/dryRun", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> dryRun(@RequestBody @Valid ActionDefinitionDTO actionDefinition) {
        actionManagerService.dryRunAction(actionDefinition);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{hash}/jobs/{jobHash}/pause", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> pauseJob(@PathVariable("hash") String actionId, @PathVariable("jobHash") String jobId) {
        jobManagerService.pause(jobId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{hash}/jobs/{jobHash}/resume", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> resumeJob(@PathVariable("hash") String actionId, @PathVariable("jobHash") String jobId) {
        actionManagerService.resumeJob(jobId);
        return ResponseEntity.noContent().build();
    }
}
