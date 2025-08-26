package com.hoatv.action.manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableAutoConfiguration
@ComponentScan({"com.hoatv.action.manager", "com.hoatv.springboot.common"})
public class ActionManagerApplication {

    public static void main (String[] args) {
        SpringApplication.run(ActionManagerApplication.class, args);
    }

}
