package com.hoatv.action.manager.controllers;


import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
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

@RestController
@RequestMapping(value = "/v1/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
public class JobControllerV1 {

    private final JobManagerService jobManagerService;

    @Autowired
    public JobControllerV1(JobManagerService jobManagerService) {
        this.jobManagerService = jobManagerService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getJobs(@RequestParam("pageIndex") @Min(0) int pageIndex,
                                     @RequestParam("pageSize") @Min(0) int pageSize) {
        Sort defaultSorting = Sort.by(Sort.Order.desc("createdAt"));
        Page<JobOverviewDTO> actionResults =
                jobManagerService.getOverviewJobs(PageRequest.of(pageIndex, pageSize, defaultSorting));
        return ResponseEntity.ok(actionResults);
    }

    @PutMapping(path = "/{hash}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateJob(@PathVariable("hash") String hash,
                                       @RequestBody @Valid JobDefinitionDTO jobDefinitionDTO) {
        jobManagerService.update(hash, jobDefinitionDTO);
        return ResponseEntity.ok(Map.of("uuid", hash));
    }

    @GetMapping(path = "/{hash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getJobById(@PathVariable("hash") String jobId) {
        JobDetailDTO jobDetailDTO = jobManagerService.getJobDetails(jobId);
        return ResponseEntity.ok(jobDetailDTO);
    }

    @PostMapping(path = "/dryRun", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> dryRun(@RequestBody @Valid JobDefinitionDTO jobDefinitionDTO) {
        jobManagerService.processNonePersistenceJob(jobDefinitionDTO);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(path = "/{jobHash}/pause", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> pauseJob(@PathVariable("jobHash") String jobId) {
        jobManagerService.pause(jobId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping(path = "/{jobHash}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> delete(@PathVariable("jobHash") String jobId) {
        jobManagerService.delete(jobId);
        return ResponseEntity.noContent().build();
    }
}
