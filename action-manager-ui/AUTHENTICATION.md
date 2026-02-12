# OAuth2/Keycloak Authentication Configuration Guide

## Overview

The Action Manager UI has been configured to work with Keycloak authentication through the Spring Cloud Gateway. This document explains the configuration and how authentication works.

## Architecture

```
┌─────────────┐
│   Browser   │
│ (React App) │
└──────┬──────┘
       │
       │ All API calls to: http://localhost:6081/api/action-manager
       │
       ▼
┌─────────────────────┐
│  Spring Cloud       │
│  Gateway            │
│  (Port 6081)        │
│                     │
│  - OAuth2 Login     │
│  - JWT Validation   │
│  - Token Relay      │
└──────┬──────────────┘
       │
       ├─► IF NOT AUTHENTICATED → Redirect to Keycloak Login
       │                          ↓
       │                   ┌──────────────┐
       │                   │  Keycloak    │
       │                   │  (Port 6080) │
       │                   └──────────────┘
       │
       ├─► IF AUTHENTICATED → Forward with JWT Token
       │
       ▼
┌─────────────────────┐
│  Action Manager     │
│  Backend            │
│  (Port 6085)        │
│                     │
│  - JWT Validation   │
│  - RBAC Enforcement │
└─────────────────────┘
```

## Configuration Changes

### 1. Environment Variables (.env)

**OLD Configuration** (Direct to Backend):
```env
REACT_APP_ACTION_MANAGER_BACKEND_URL=http://actmanager.local:6085
```

**NEW Configuration** (Through Gateway):
```env
REACT_APP_ACTION_MANAGER_BACKEND_URL=http://localhost:6081/api/action-manager
```

The Gateway URL structure is:
```
http://<gateway-host>:<gateway-port>/api/<service-name>
```

### 2. API URL Mapping

All backend services are now accessed through the Gateway:

| Service | Old URL | New URL (via Gateway) |
|---------|---------|----------------------|
| Action Manager | `http://actmanager.local:6085` | `http://localhost:6081/api/action-manager` |
| Template Manager | `http://templateman.local:6087` | `http://localhost:6081/api/template-manager` |
| E-commerce Stats | `http://actmanager.local:6085` | `http://localhost:6081/api/e-commerce-stats` |
| Endpoint Collector | `http://extendpoint.local:6082` | `http://localhost:6081/api/ext-endpoint-collector` |
| Kafka Notifier | `http://kafkanotifier.local:6089` | `http://localhost:6081/api/kafka-notifier` |

## How Authentication Works

### Initial Access (No Authentication)

1. User navigates to `http://localhost:3000`
2. React app loads and makes API call to `http://localhost:6081/api/action-manager/v1/actions`
3. Gateway detects no authentication session
4. Gateway sends HTTP 302 redirect to Keycloak login page
5. Browser follows redirect to `http://localhost:6080/realms/pman-realm/protocol/openid-connect/auth`

### After Login

1. User enters credentials on Keycloak login page
2. Keycloak validates credentials
3. Keycloak redirects back to Gateway with authorization code
4. Gateway exchanges code for JWT access token
5. Gateway stores session and JWT token
6. Browser is redirected back to original URL
7. Subsequent API calls include session cookie

### API Request Flow (Authenticated)

1. React app makes fetch request: `fetch('http://localhost:6081/api/action-manager/v1/actions')`
2. Browser includes session cookie automatically
3. Gateway validates session and JWT token
4. Gateway adds JWT to Authorization header: `Authorization: Bearer <jwt-token>`
5. Gateway forwards to backend: `http://action-manager-backend:6085/v1/actions`
6. Backend validates JWT signature and extracts user roles
7. Backend enforces role-based access control
8. Backend returns response to Gateway
9. Gateway returns response to React app

### Token Refresh

- Gateway automatically refreshes expired access tokens using refresh token
- React app doesn't need to handle token refresh
- Token refresh is transparent to the frontend

### Logout

1. User clicks logout button in UI
2. React app calls logout endpoint (if implemented) or clears local state
3. Gateway invalidates session
4. User redirected to Keycloak logout endpoint
5. Keycloak ends SSO session
6. User redirected back to application login page

## Code Examples

### Making API Calls (No Changes Required!)

The existing `RestClient` and `fetch()` calls work without modification:

```tsx
// This still works as-is!
const response = await fetch(
  `${ACTION_MANAGER_API_URL}/v1/actions?pageIndex=0&pageSize=10`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);
```

The key is that `ACTION_MANAGER_API_URL` now points to the Gateway instead of direct backend.

### API URL from Environment

```tsx
// src/components/AppConstants.tsx
const ACTION_MANAGER_API_URL = window._env_.REACT_APP_ACTION_MANAGER_BACKEND_URL;
// Value: http://localhost:6081/api/action-manager
```

## Testing

### 1. Start Required Services

```bash
# Start Keycloak
docker-compose up -d keycloak

# Start Gateway
cd base-platform/common-apps/spring-cloud-gateway-app
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Start Action Manager Backend
cd services/action-manager-app/action-manager-backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Start React UI
cd services/action-manager-app/action-manager-ui
yarn start
```

### 2. Test Authentication Flow

1. Open browser to `http://localhost:3000`
2. Should be redirected to Keycloak login
3. Login with test user (e.g., `manager@pman.local` / `manager123`)
4. Should be redirected back to app
5. Verify actions load successfully

### 3. Test Role-Based Access

**As ACTION_VIEWER:**
- ✅ Can view actions and jobs
- ❌ Cannot create or edit actions (403 Forbidden)

**As ACTION_MANAGER:**
- ✅ Can view, create, and edit actions
- ❌ Cannot delete actions (403 Forbidden)

**As ADMIN:**
- ✅ Can perform all operations

## Browser DevTools Inspection

### Check Authentication Redirect

1. Open DevTools → Network tab
2. Access app for first time
3. Look for:
   - Status 302 redirect to Keycloak
   - Login form loads from Keycloak
   - After login: redirect back to app

### Check JWT Token Relay

1. Open DevTools → Network tab
2. Make an API call (e.g., load actions)
3. Inspect request to Gateway
4. Note: JWT is NOT visible in browser (stored in Gateway session)
5. Check response headers for session cookie

### Check Backend Request

Backend logs should show:
```
Received request to /v1/actions with JWT token
Subject: user-uuid
Roles: ROLE_ACTION_MANAGER
```

## Troubleshooting

### Problem: Infinite Redirect Loop

**Symptoms:** Browser keeps redirecting between app and Keycloak

**Solutions:**
1. Check Keycloak is running: `curl http://localhost:6080`
2. Verify client redirect URIs in Keycloak include `http://localhost:6081/*`
3. Clear browser cookies and try again
4. Check Gateway logs for OAuth2 errors

### Problem: 401 Unauthorized After Login

**Symptoms:** Login succeeds but API calls return 401

**Solutions:**
1. Check Gateway can reach Keycloak: `curl http://localhost:6080/realms/pman-realm/.well-known/openid-configuration`
2. Verify Gateway JWT validation configuration
3. Check backend JWT issuer-uri matches Keycloak realm
4. Inspect Gateway logs for JWT validation errors

### Problem: 403 Forbidden on Specific Actions

**Symptoms:** Some operations work, others return 403

**Solutions:**
1. Check user roles in Keycloak
2. Verify role mapping in backend SecurityConfig
3. Check backend logs for authorization decisions
4. Ensure role names match exactly (e.g., `action-manager` vs `ACTION_MANAGER`)

### Problem: CORS Errors

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Backend CORS should allow Gateway origin
2. Gateway should have proper CORS configuration
3. Check `Access-Control-Allow-Origin` headers in response
4. Verify credentials are allowed in CORS config

## Environment-Specific Configuration

### Development (.env)

```env
REACT_APP_ACTION_MANAGER_BACKEND_URL=http://localhost:6081/api/action-manager
```

### Production (.env.production)

```env
REACT_APP_ACTION_MANAGER_BACKEND_URL=http://api-gateway:8081/api/action-manager
```

### Docker Compose

Update frontend service to use Gateway:

```yaml
action-manager-ui:
  environment:
    - REACT_APP_ACTION_MANAGER_BACKEND_URL=http://api-gateway:8081/api/action-manager
```

## Migration Checklist

- [x] Update `.env` to use Gateway URLs
- [x] Create `.env.production` for production config
- [x] Update README with authentication documentation
- [x] Test authentication flow works
- [ ] Update docker-compose environment variables (if applicable)
- [ ] Test in production environment
- [ ] Document user role requirements
- [ ] Create Keycloak realm export for deployment

## Related Documentation

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Spring Cloud Gateway Security](https://spring.io/guides/gs/gateway/)
- [OAuth2 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [Issue #187](https://github.com/hvantran/project-management/issues/187)

## Support

For questions or issues:
1. Check Gateway logs: `docker logs api-gateway`
2. Check Backend logs: `docker logs action-manager-backend`
3. Check Keycloak logs: `docker logs keycloak`
4. Raise issue on GitHub with logs attached
