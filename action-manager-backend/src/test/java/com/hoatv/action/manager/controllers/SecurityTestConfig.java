package com.hoatv.action.manager.controllers;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for testing authorization rules
 * Unlike TestConfig, this ENABLES security to test @PreAuthorize annotations
 */
@Configuration
@EnableAutoConfiguration(exclude = {
    KafkaAutoConfiguration.class,
    MongoDataAutoConfiguration.class
})
@ComponentScan(basePackages = {"com.hoatv.action.manager.controllers"})
@EnableWebSecurity
@EnableMethodSecurity  // Enable @PreAuthorize
public class SecurityTestConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .csrf(csrf -> csrf.disable())
            .httpBasic();
        return http.build();
    }
}
