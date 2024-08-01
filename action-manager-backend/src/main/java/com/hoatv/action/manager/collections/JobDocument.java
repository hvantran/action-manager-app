package com.hoatv.action.manager.collections;

import com.hoatv.action.manager.api.ImmutableJob;
import com.hoatv.action.manager.dtos.JobCategory;
import lombok.*;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.UUID;

@Document("jobs")
@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@FieldNameConstants
@AllArgsConstructor
public class JobDocument implements ImmutableJob {

    @Id
    @Builder.Default
    private String hash = UUID.randomUUID().toString();

    private JobCategory jobCategory;
    private String jobContent;
    private String contentTemplates;
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
    private JobStatus jobStatus;
}
