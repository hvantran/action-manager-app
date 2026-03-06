package com.hoatv.action.manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Security configuration for Action Manager Backend with Keycloak JWT validation.
 * Implements OAuth2 Resource Server pattern with:
 * - JWT token validation
 * - Role-based access control from Keycloak realm roles
 * - Method-level security
 * - Stateless session management
 * 
 * Related to hvantran/project-management#187
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                
                // Action endpoints - role-based access
                .requestMatchers(HttpMethod.GET, "/v1/actions/**").hasAnyRole("ACTION_VIEWER", "ACTION_MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/v1/actions").hasAnyRole("ACTION_MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/v1/actions/*/jobs").hasAnyRole("ACTION_MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/v1/actions/**").hasAnyRole("ACTION_MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/v1/actions/**").hasAnyRole("ACTION_MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/v1/actions/**").hasRole("ADMIN")
                
                // Job endpoints - read-only GET for viewer+, write for manager/admin
                .requestMatchers(HttpMethod.GET, "/v1/jobs/**").hasAnyRole("ACTION_VIEWER", "ACTION_MANAGER", "ADMIN")
                .requestMatchers("/v1/jobs/**").hasAnyRole("ACTION_MANAGER", "ADMIN")
                
                // Statistics endpoints - read-only, require viewer or higher
                .requestMatchers("/v1/statistics/**").hasAnyRole("ACTION_VIEWER", "ACTION_MANAGER", "ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .csrf(csrf -> csrf.disable());
            
        return http.build();
    }

    /**
     * Converts JWT tokens to Spring Security authentication with roles from Keycloak.
     * Extracts roles from realm_access.roles claim and converts them to granted authorities.
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter());
        return jwtAuthenticationConverter;
    }

    /**
     * Extracts granted authorities from JWT token.
     * Combines standard scopes with Keycloak realm roles.
     */
    private Converter<Jwt, Collection<GrantedAuthority>> jwtGrantedAuthoritiesConverter() {
        JwtGrantedAuthoritiesConverter standardConverter = new JwtGrantedAuthoritiesConverter();
        
        return jwt -> {
            // Get standard scopes (if any)
            Collection<GrantedAuthority> standardAuthorities = standardConverter.convert(jwt);
            
            // Extract Keycloak realm roles
            Collection<GrantedAuthority> realmRoles = extractRealmRoles(jwt);
            
            // Combine both
            return Stream.concat(
                standardAuthorities != null ? standardAuthorities.stream() : Stream.empty(),
                realmRoles.stream()
            ).collect(Collectors.toList());
        };
    }

    /**
     * Extracts realm roles from Keycloak JWT token's realm_access.roles claim.
     */
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        
        if (realmAccess == null || !realmAccess.containsKey("roles")) {
            return Collections.emptyList();
        }

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) realmAccess.get("roles");
        
        return roles.stream()
                .map(role -> "ROLE_" + role.toUpperCase().replace("-", "_"))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}
