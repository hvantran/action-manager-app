package com.hoatv.action.manager.repositories;

import com.hoatv.action.manager.collections.JobResultDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobExecutionResultDocumentRepository extends MongoRepository<JobResultDocument, String> {

    List<JobResultDocument> findByJobIdIn(List<String> jobIds);

    void deleteByActionId(String actionId);
}
