package com.hoatv.action.manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableAutoConfiguration
@ComponentScan({"com.hoatv.action.manager", "com.hoatv.springboot.common"})
@EnableMongoRepositories
public class ActionManagerApplication {
    public static void main (String[] args) {
        try{
        SpringApplication.run(ActionManagerApplication.class, args);
    } catch (Throwable e) {
        e.printStackTrace();
    }
    }
}
