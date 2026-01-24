package com.hoatv.action.manager.api;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.action.manager.dtos.RestoreResponse;
import com.hoatv.fwk.common.ultilities.Pair;
import jakarta.servlet.ServletOutputStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface ActionManagerService {

    String create(ActionDefinitionDTO actionDefinition);

    void update(String actionId, ActionDefinitionDTO actionDefinitionDTO);

    /**
     * @deprecated Use {@link #softDelete(String)} followed by {@link #permanentDelete(String)} instead.
     * This method will be removed in version 2.0 (6 months grace period).
     */
    @Deprecated(since = "1.5.0", forRemoval = true)
    void delete(String hash);

    void softDelete(String actionId);

    void permanentDelete(String actionId);

    void resume(String jobHash);

    void archive(String actionId);

    void pause(String actionId);

    /**
     * @deprecated Use {@link #restore(String, ActionStatus)} instead.
     */
    @Deprecated(since = "1.5.0")
    void restore(String actionId);

    RestoreResponse restore(String actionId, ActionStatus targetStatus);

    boolean replay(String hash);

    boolean replayFailure(String hash);

    boolean replayJob(String actionId, String jobId);

    Optional<ActionDefinitionDTO> getActionById(String hash);

    ActionDefinitionDTO setFavorite(String hash, boolean isFavorite);

    Page<ActionOverviewDTO> search(String search, Pageable pageable);

    Page<ActionOverviewDTO> getActions(List<ActionStatus> filterStatus, Pageable pageable);

    ActionDocument createActionDocument(ActionDefinitionDTO actionDefinition);

    String addJobsToAction(String hash, List<JobDefinitionDTO> jobDefinitionDTOs);

    void dryRun(ActionDefinitionDTO actionDefinition);

    Pair<String, byte[]> export(String actionId, ServletOutputStream responseOutputStream) throws IOException;

    String importAction(MultipartFile multipartFile) throws IOException;

}
