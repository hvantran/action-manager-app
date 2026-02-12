package com.hoatv.action.manager.controllers;

import com.hoatv.action.manager.services.ActionManagerStatistics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping(value = "/v1/statistics", produces = MediaType.APPLICATION_JSON_VALUE)
public class StatisticsControllerV1 {

    private final ActionManagerStatistics actionManagerStatistics;

    @Autowired
    public StatisticsControllerV1(ActionManagerStatistics actionManagerStatistics) {
        this.actionManagerStatistics = actionManagerStatistics;
    }

    @GetMapping(value = "/failures", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ACTION_VIEWER', 'ACTION_MANAGER', 'ADMIN')")
    public ResponseEntity<FailureStatisticsDTO> getFailureStatistics() {
        long totalFailedJobs = actionManagerStatistics.getTotalFailedJobs();

        FailureStatisticsDTO responseBody = new FailureStatisticsDTO(totalFailedJobs, Instant.now());
        return ResponseEntity.ok(responseBody);
    }

    public static class FailureStatisticsDTO {

        private long totalFailedJobs;
        private Instant timestamp;

        public FailureStatisticsDTO(long totalFailedJobs, Instant timestamp) {
            this.totalFailedJobs = totalFailedJobs;
            this.timestamp = timestamp;
        }

        public long getTotalFailedJobs() {
            return totalFailedJobs;
        }

        public Instant getTimestamp() {
            return timestamp;
        }
    }
}
