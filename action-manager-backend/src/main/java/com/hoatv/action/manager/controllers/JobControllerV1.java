package com.hoatv.action.manager.controllers;


import com.hoatv.action.manager.api.JobManagerService;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.JobDetailDTO;
import com.hoatv.action.manager.dtos.JobOverviewDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger LOGGER = LoggerFactory.getLogger(JobControllerV1.class);
    private JobManagerService jobManagerService;

    @Autowired
    public JobControllerV1(JobManagerService jobManagerService) {
        this.jobManagerService = jobManagerService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getJobs(@RequestParam("pageIndex") @Min(0) int pageIndex,
                                     @RequestParam("pageSize") @Min(0) int pageSize) {
        Sort defaultSorting = Sort.by(Sort.Order.desc("createdAt"));
        Page<JobOverviewDTO> actionResults =
                jobManagerService.getJobs(PageRequest.of(pageIndex, pageSize, defaultSorting));
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
        JobDetailDTO jobDetailDTO = jobManagerService.getJob(jobId);
        return ResponseEntity.ok(jobDetailDTO);
    }

    @PostMapping(path = "/{hash}/dryRun", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> dryRun(@PathVariable("hash") String jobId,
                                    @RequestBody @Valid JobDefinitionDTO jobDefinitionDTO) {
        LOGGER.info("Execute dry run on persisted job: {}", jobId);
        jobManagerService.processNonePersistenceJob(jobDefinitionDTO);
        return ResponseEntity.noContent().build();
    }
}
