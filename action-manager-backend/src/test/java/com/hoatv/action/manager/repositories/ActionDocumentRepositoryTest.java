package com.hoatv.action.manager.repositories;

import com.hoatv.action.manager.collections.ActionDocument;
import com.hoatv.action.manager.collections.ActionStatus;
import com.hoatv.action.manager.config.MongoConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

@DataMongoTest(excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = MongoConfig.class))
@ActiveProfiles("test")
@ContextConfiguration(classes = ActionDocumentRepositoryTest.TestMongoConfiguration.class)
@DisabledIfEnvironmentVariable(named = "GITHUB_ACTIONS", matches = "true")
class ActionDocumentRepositoryTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @EnableMongoRepositories(basePackageClasses = ActionDocumentRepository.class)
    static class TestMongoConfiguration {
    }

    @Autowired
    private ActionDocumentRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();

        ActionDocument action1 = new ActionDocument();
        action1.setActionName("Deploy Application");
        action1.setActionDescription("Deploy to production environment");
        action1.setActionStatus(ActionStatus.ACTIVE);
        repository.save(action1);

        ActionDocument action2 = new ActionDocument();
        action2.setActionName("Backup Database");
        action2.setActionDescription("Create daily backup");
        action2.setActionStatus(ActionStatus.ACTIVE);
        repository.save(action2);

        ActionDocument action3 = new ActionDocument();
        action3.setActionName("Monitor Services");
        action3.setActionDescription("Check application health");
        action3.setActionStatus(ActionStatus.ACTIVE);
        repository.save(action3);
    }

    @Test
    void searchByNameOrDescription_shouldFindByName() {
        Page<ActionDocument> results = repository.searchByNameOrDescription(
                "Deploy",
                PageRequest.of(0, 10)
        );

        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getActionName()).isEqualTo("Deploy Application");
    }

    @Test
    void searchByNameOrDescription_shouldFindByDescription() {
        Page<ActionDocument> results = repository.searchByNameOrDescription(
                "backup",
                PageRequest.of(0, 10)
        );

        assertThat(results.getContent()).hasSize(1);
        assertThat(results.getContent().get(0).getActionName()).isEqualTo("Backup Database");
    }

    @Test
    void searchByNameOrDescription_shouldBeCaseInsensitive() {
        Page<ActionDocument> results = repository.searchByNameOrDescription(
                "DEPLOY",
                PageRequest.of(0, 10)
        );

        assertThat(results.getContent()).hasSize(1);
    }

    @Test
    void searchByNameOrDescription_shouldFindPartialMatches() {
        Page<ActionDocument> results = repository.searchByNameOrDescription(
                "app",
                PageRequest.of(0, 10)
        );

        assertThat(results.getContent()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void searchByNameOrDescription_shouldReturnEmptyForNoMatches() {
        Page<ActionDocument> results = repository.searchByNameOrDescription(
                "nonexistent",
                PageRequest.of(0, 10)
        );

        assertThat(results.getContent()).isEmpty();
    }

    @Test
    void searchByNameOrDescription_shouldSupportPagination() {
        Page<ActionDocument> page1 = repository.searchByNameOrDescription(
                "a",
                PageRequest.of(0, 2)
        );

        assertThat(page1.getContent()).hasSize(2);
        assertThat(page1.getTotalElements()).isEqualTo(3);
        assertThat(page1.getTotalPages()).isEqualTo(2);
    }
}
