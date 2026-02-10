package com.hoatv.action.manager.controllers;


import com.hoatv.action.manager.api.ActionManagerService;
import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobExecutionStatus;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import com.hoatv.action.manager.dtos.PageResponseDTO;
import com.hoatv.springboot.common.validation.ValueOfEnum;
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
@RequestMapping(value = "/v1/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
public class JobControllerV1 {

    private final JobManagerService jobManagerService;
    private final ActionManagerService actionManagerService;

    @Autowired
    public JobControllerV1(JobManagerService jobManagerService, ActionManagerService actionManagerService) {
        this.jobManagerService = jobManagerService;
        this.actionManagerService = actionManagerService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getJobs(@RequestParam("pageIndex") @Min(0) int pageIndex,
                                     @RequestParam("pageSize") @Min(0) int pageSize,
                                     @RequestParam(value = "status", required = false) 
                                     @ValueOfEnum(JobExecutionStatus.class) String status) {
        Sort defaultSorting = Sort.by(Sort.Order.desc(JobDocument.Fields.createdAt));
        PageRequest pageRequest = PageRequest.of(pageIndex, pageSize, defaultSorting);
        
        JobExecutionStatus statusFilter = status != null 
            ? JobExecutionStatus.valueOf(status.toUpperCase()) 
            : null;
        
        Page<JobOverviewDTO> actionResults = jobManagerService.getOverviewJobs(pageRequest, statusFilter);
        return ResponseEntity.ok(new PageResponseDTO<>(actionResults));
    }

    @PutMapping(path = "/{jobId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> updateJob(@PathVariable("jobId") String hash,
                                       @RequestBody @Valid JobDefinitionDTO jobDefinitionDTO) {
        jobManagerService.update(hash, jobDefinitionDTO);
        return ResponseEntity.ok(Map.of("uuid", hash));
    }

    @GetMapping(path = "/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getJobById(@PathVariable("jobId") String jobId) {
        JobDetailDTO jobDetailDTO = jobManagerService.getJobDetails(jobId);
        return ResponseEntity.ok(jobDetailDTO);
    }

    @PostMapping(path = "/validations", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> validate(@RequestBody @Valid JobDefinitionDTO jobDefinitionDTO,
                                         @RequestParam("actionId") String actionId) {
        Optional<ActionDefinitionDTO> actionOptional = actionManagerService.getActionById(actionId);
        jobManagerService.processNonePersistenceJob(jobDefinitionDTO, actionOptional.orElseThrow());
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{jobId}/pause", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> pauseJob(@PathVariable("jobId") String jobId) {
        jobManagerService.pause(jobId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping(path = "/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> delete(@PathVariable("jobId") String jobId) {
        jobManagerService.delete(jobId);
        return ResponseEntity.noContent().build();
    }
}
