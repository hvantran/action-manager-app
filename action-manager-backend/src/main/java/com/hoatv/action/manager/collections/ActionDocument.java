package com.hoatv.action.manager.collections;

import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
    private long createdAt;

    public static ActionDocument fromActionDefinition(ActionDefinitionDTO actionDefinitionDTO) {
        return ActionDocument.builder()
                .actionName(actionDefinitionDTO.getActionName())
                .actionDescription(actionDefinitionDTO.getActionDescription())
                .configurations(actionDefinitionDTO.getConfigurations())
                .isFavorite(actionDefinitionDTO.isFavorite())
                .createdAt(DateTimeUtils.getCurrentEpochTimeInSecond())
                .build();
    }

    public static ActionDefinitionDTO toActionDefinition(ActionDocument actionDocument) {
        return ActionDefinitionDTO.builder()
                .hash(actionDocument.getHash())
                .actionName(actionDocument.getActionName())
                .isFavorite(actionDocument.isFavorite())
                .actionDescription(actionDocument.getActionDescription())
                .configurations(actionDocument.getConfigurations())
                .createdAt(actionDocument.getCreatedAt())
                .build();
    }
}
