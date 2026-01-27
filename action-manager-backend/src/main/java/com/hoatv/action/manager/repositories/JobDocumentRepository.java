package com.hoatv.action.manager.repositories;

import com.hoatv.action.manager.collections.JobDocument;
import com.hoatv.action.manager.collections.JobStatus;
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
    List<JobDocument> findByIsScheduledTrueAndJobStatusAndActionIdIn(JobStatus status, Collection<String> actionIds);
    List<JobDocument> findByIsScheduledTrueAndJobStatusAndActionId(JobStatus status, String actionId);
    List<JobDocument> findByIsScheduledFalseAndJobStatusAndActionId(JobStatus status, String actionId);
    Page<JobDocument> findJobByActionId(String actionId, Pageable pageable);
    Page<JobDocument> findJobByActionIdAndJobNameContainingIgnoreCase(String actionId, String searchText, Pageable pageable);
    List<JobIdImmutable> findJobsByActionId(String actionId);
    Page<JobDocument> findByHashIn(List<String> hashes, Pageable pageable);

    interface JobIdImmutable {
        String getHash();
    }
}
