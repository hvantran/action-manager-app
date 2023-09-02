package com.hoatv.action.manager.api;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.dtos.ActionDefinitionDTO;
import com.hoatv.action.manager.dtos.ActionOverviewDTO;
import com.hoatv.action.manager.dtos.JobDefinitionDTO;
import com.hoatv.fwk.common.ultilities.Pair;
import jakarta.servlet.ServletOutputStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface ActionManagerService {

    String createAction(ActionDefinitionDTO actionDefinition);

    Optional<ActionDefinitionDTO> getActionById(String hash);

    Optional<ActionDefinitionDTO> setFavorite(String hash, boolean isFavorite);

    Page<ActionOverviewDTO> search(String search, Pageable pageable);

    Page<ActionOverviewDTO> getActions(List<ActionStatus> filterStatus, Pageable pageable);

    void delete(String hash);

    boolean replay(String hash);

    ActionDocument createActionDocument(ActionDefinitionDTO actionDefinition);

    String addJobsToAction (String hash, List<JobDefinitionDTO> jobDefinitionDTOs);

    void dryRun(ActionDefinitionDTO actionDefinition);

    void resume(String jobHash);

    void archive(String actionId);

    void restore(String actionId);

    Pair<String, byte[]> export(String actionId, ServletOutputStream responseOutputStream) throws IOException;

    String importAction(MultipartFile multipartFile) throws IOException;
}
