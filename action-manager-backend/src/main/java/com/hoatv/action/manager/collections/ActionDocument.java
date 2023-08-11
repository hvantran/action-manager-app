package com.hoatv.action.manager.collections;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Document("actions")
@Getter
@Setter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ActionDocument {
    @Id
    @Builder.Default
    private String hash = UUID.randomUUID().toString();

    private String actionName;
    private boolean isFavorite;
    private String actionDescription;
    private String configurations;
    private ActionStatus actionStatus;
    private long createdAt;

}
