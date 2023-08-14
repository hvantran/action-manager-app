package com.hoatv.action.manager.api;

import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ActionManagerService {

    String processAction(ActionDefinitionDTO actionDefinition);

    Optional<ActionDefinitionDTO> getActionById(String hash);

    Optional<ActionDefinitionDTO> setFavoriteActionValue(String hash, boolean isFavorite);

    Page<ActionOverviewDTO> searchActions(String search, Pageable pageable);

    Page<ActionOverviewDTO> getActions(List<ActionStatus> filterStatus, Pageable pageable);

    void deleteAction(String hash);

    boolean replayAction(String hash);

    String addJobsToAction (String hash, List<JobDefinitionDTO> jobDefinitionDTOs);

    void dryRunAction (ActionDefinitionDTO actionDefinition);

    void resumeJob(String jobHash);

    void archive(String actionId);

    void restore(String actionId);
}
