package com.hoatv.action.manager.collections;

import com.hoatv.action.manager.api.JobImmutable;
import com.hoatv.action.manager.dtos.JobCategory;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.UUID;

@Document("jobs")
@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class JobDocument implements JobImmutable {

    @Id
    @Builder.Default
    private String hash = UUID.randomUUID().toString();

    private JobCategory jobCategory;
    private String jobContent;
    private String jobDescription;
    private String configurations;
    private String jobName;
    private String actionId;
    private boolean isAsync;
    private List<String> outputTargets;
    private boolean isScheduled;
    private int scheduleInterval;
    private String scheduleUnit;
    private long createdAt;
    private long updatedAt;
    private String jobStatus;

    @Transient
    public JobStatus getJobStatus() {
        return JobStatus.valueOf(this.jobStatus);
    }


}
