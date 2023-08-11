package com.hoatv.action.manager.collections;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Document("jobs-result-statistics")
@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class JobResultDocument {

    @Id
    @Builder.Default
    private String hash = UUID.randomUUID().toString();
    private JobState jobState;
    private JobExecutionStatus jobExecutionStatus;
    private String failureNotes;
    private String jobId;
    private String actionId;
    private long createdAt;
    private long endedAt;
    private long elapsedTime;
    private long startedAt;
    private long updatedAt;

}
