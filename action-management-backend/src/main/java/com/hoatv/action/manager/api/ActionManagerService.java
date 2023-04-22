package com.hoatv.action.manager.api;

import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ActionManagerService {

    String processAction(ActionDefinitionDTO actionDefinition);

    Optional<ActionDefinitionDTO> getActionById(String hash);

    Optional<ActionDefinitionDTO> setFavoriteActionValue(String hash, boolean isFavorite);

    Page<ActionOverviewDTO> getAllActionsWithPaging(String search, Pageable pageable);

    Page<ActionOverviewDTO> getAllActionsWithPaging(Pageable pageable);

    void deleteAction(String hash);

    boolean replayAction(String hash);
}
