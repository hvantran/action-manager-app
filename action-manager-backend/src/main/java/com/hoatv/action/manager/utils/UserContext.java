package com.hoatv.action.manager.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility component for extracting user context information from JWT tokens.
 * Provides convenient access to authenticated user details from Keycloak tokens.
 * 
 * Related to hvantran/project-management#187
 */
@Component
public class UserContext {

    /**
     * Gets the current authenticated user's username (preferred_username from Keycloak).
     * 
     * @return Optional containing username, or empty if not authenticated
     */
    public Optional<String> getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String username = jwt.getClaimAsString("preferred_username");
            return Optional.ofNullable(username);
        }
        
        return Optional.empty();
    }

    /**
     * Gets the current authenticated user's unique identifier (sub claim from JWT).
     * 
     * @return Optional containing user ID, or empty if not authenticated
     */
    public Optional<String> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return Optional.ofNullable(jwt.getSubject());
        }
        
        return Optional.empty();
    }

    /**
     * Gets the current authenticated user's email address.
     * 
     * @return Optional containing email, or empty if not available
     */
    public Optional<String> getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String email = jwt.getClaimAsString("email");
            return Optional.ofNullable(email);
        }
        
        return Optional.empty();
    }

    /**
     * Gets the current authenticated user's full name.
     * Combines given_name and family_name claims.
     * 
     * @return Optional containing full name, or empty if not available
     */
    public Optional<String> getCurrentUserFullName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String givenName = jwt.getClaimAsString("given_name");
            String familyName = jwt.getClaimAsString("family_name");
            
            if (givenName != null && familyName != null) {
                return Optional.of(givenName + " " + familyName);
            } else if (givenName != null) {
                return Optional.of(givenName);
            } else if (familyName != null) {
                return Optional.of(familyName);
            }
        }
        
        return Optional.empty();
    }

    /**
     * Gets all roles assigned to the current authenticated user.
     * 
     * @return Set of role names (with ROLE_ prefix), or empty set if not authenticated
     */
    public Set<String> getCurrentUserRoles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null) {
            return auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());
        }
        
        return Set.of();
    }

    /**
     * Checks if the current user has a specific role.
     * 
     * @param role Role to check (with or without ROLE_ prefix)
     * @return true if user has the role, false otherwise
     */
    public boolean hasRole(String role) {
        String roleToCheck = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return getCurrentUserRoles().contains(roleToCheck);
    }

    /**
     * Checks if the current user has any of the specified roles.
     * 
     * @param roles Roles to check (with or without ROLE_ prefix)
     * @return true if user has at least one of the roles, false otherwise
     */
    public boolean hasAnyRole(String... roles) {
        Set<String> userRoles = getCurrentUserRoles();
        
        for (String role : roles) {
            String roleToCheck = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            if (userRoles.contains(roleToCheck)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Gets the complete JWT token for the current authenticated user.
     * 
     * @return Optional containing JWT, or empty if not authenticated with JWT
     */
    public Optional<Jwt> getCurrentJwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return Optional.of(jwtAuth.getToken());
        }
        
        return Optional.empty();
    }

    /**
     * Checks if there is an authenticated user in the current security context.
     * 
     * @return true if user is authenticated, false otherwise
     */
    public boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated();
    }
}
