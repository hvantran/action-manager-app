package com.hoatv.action.manager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.action.manager.services.KafkaMetricConsumer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;

@Configuration
public class KafkaConfig {
    @Bean
    public KafkaMetricConsumer getKafkaMetricConsumer(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        return new KafkaMetricConsumer(kafkaTemplate, objectMapper);
    }
}
