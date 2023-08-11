package com.hoatv.action.manager.document.transformers;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.fwk.common.ultilities.DateTimeUtils;

public final class ActionTransformer {
    private ActionTransformer() {}
    public static ActionDocument fromActionDefinition(ActionDefinitionDTO actionDefinitionDTO) {
        return ActionDocument.builder()
                .actionName(actionDefinitionDTO.getActionName())
                .actionDescription(actionDefinitionDTO.getActionDescription())
                .configurations(actionDefinitionDTO.getConfigurations())
                .actionStatus(ActionStatus.valueOf(actionDefinitionDTO.getActionStatus()))
                .isFavorite(actionDefinitionDTO.isFavorite())
                .actionStatus(ActionStatus.valueOf(actionDefinitionDTO.getActionStatus()))
                .createdAt(DateTimeUtils.getCurrentEpochTimeInSecond())
                .build();
    }

    public static ActionDefinitionDTO toActionDefinition(ActionDocument actionDocument) {
        return ActionDefinitionDTO.builder()
                .hash(actionDocument.getHash())
                .actionName(actionDocument.getActionName())
                .isFavorite(actionDocument.isFavorite())
                .actionStatus(actionDocument.getActionStatus().name())
                .actionDescription(actionDocument.getActionDescription())
                .configurations(actionDocument.getConfigurations())
                .actionStatus(actionDocument.getActionStatus().name())
                .createdAt(actionDocument.getCreatedAt())
                .build();
    }
}
