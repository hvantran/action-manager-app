package com.hoatv.action.manager.controllers;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableAutoConfiguration(exclude = {KafkaAutoConfiguration.class, MongoDataAutoConfiguration.class})
@ComponentScan(basePackages = {"com.hoatv.action.manager.controllers", "com.hoatv.springboot.common.advices"})
public class TestConfig {
}
