package com.hoatv.action.manager.repositories;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface ActionDocumentRepository extends MongoRepository<ActionDocument, String> {

    @Query("{actionName: {$regex : ?0, $options: 'i'}}")
    List<ActionDocument> findActionByName(String actionName);

    @Query("{actionName: {$regex : ?0, $options: 'i'}}")
    Page<ActionDocument> findActionByName(String actionName, Pageable pageable);

    List<ActionDocument> findByHashIn(Set<String> actionIds);

    List<ActionDocument> findByActionStatus(ActionStatus actionStatus);
    Page<ActionDocument> findByActionStatusIn(Collection<ActionStatus> actionStatuses, Pageable pageable);
}
