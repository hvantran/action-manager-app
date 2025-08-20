package com.hoatv.action.manager;

import com.hoatv.action.manager.config.KafkaMetricConsumer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;

@Configuration
@EnableAutoConfiguration
@ComponentScan({"com.hoatv.action.manager", "com.hoatv.springboot.common"})
public class ActionManagerApplication {

    public static void main (String[] args) {
        SpringApplication.run(ActionManagerApplication.class, args);
    }

    @Bean
    public KafkaMetricConsumer getKafkaMetricConsumer(KafkaTemplate<String, String> kafkaTemplate) {
        return new KafkaMetricConsumer(kafkaTemplate);
    }
}
