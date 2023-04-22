package com.hoatv.action.manager.repositories;

import com.hoatv.action.manager.collections.ActionStatisticsDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface ActionStatisticsDocumentRepository extends MongoRepository<ActionStatisticsDocument, String> {

    List<ActionStatisticsDocument> findByActionIdIn(Set<String> actionId);

    ActionStatisticsDocument findByActionId(String actionId);

    void deleteByActionId(String actionId);
}
