package com.hoatv.action.manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration for Action Manager Backend.
 * Configured to work with OAuth2/JWT authentication from the gateway.
 * 
 * Related to hvantran/project-management#187
 */
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow requests from frontend and gateway
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",           // Frontend dev
            "http://localhost:3001",           // Alternative frontend
            "http://localhost:6081",           // Gateway dev
            "http://localhost:6084",           // Frontend production port
            "http://localhost:8070",           // Alternative port
            "http://actmanagerui.local:3000",  // Local domain dev
            "http://actmanagerui.local:6081",  // Local domain gateway
            "http://actmanagerui.local:6084",  // Local domain production
            "http://api-gateway:8081"          // Gateway container name
        ));
        
        // Allow all standard HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        
        // Allow all headers including Authorization for JWT
        configuration.setAllowedHeaders(List.of("*"));
        
        // Allow credentials (required for cookies and Authorization header)
        configuration.setAllowCredentials(true);
        
        // Expose Authorization header so frontend can read it
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Total-Count"
        ));
        
        // Cache preflight response for 1 hour
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
