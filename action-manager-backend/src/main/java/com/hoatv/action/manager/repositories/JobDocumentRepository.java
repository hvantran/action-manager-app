package com.hoatv.action.manager.repositories;

import com.hoatv.action.manager.collections.JobDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface JobDocumentRepository extends MongoRepository<JobDocument, String> {

    void deleteByActionId(String actionId);
    List<JobDocument> findJobByActionId(String actionId);
    List<JobDocument> findByIsScheduledTrueAndJobStatusAndActionIdIn(String status, Collection<String> actionIds);
    List<JobDocument> findByIsScheduledTrueAndJobStatusAndActionId(String status, String actionId);
    List<JobDocument> findByIsScheduledFalseAndJobStatusAndActionId(String status, String actionId);
    Page<JobDocument> findJobByActionId(String actionId, Pageable pageable);
}
