# Action Manager UI

React-based frontend application for managing actions and jobs with Keycloak authentication.

## 🔐 Authentication & Authorization

This application uses **Keycloak** for authentication and authorization through the **Spring Cloud Gateway** (backoffice pattern).

### How It Works

1. **All API calls are routed through the Gateway** at `http://localhost:6081/api/action-manager`
2. Gateway checks if user is authenticated
3. If not authenticated, Gateway redirects to **Keycloak login page**
4. After successful login, Keycloak issues a **JWT token**
5. Gateway validates JWT and forwards requests to backend with token relay
6. Backend validates JWT and enforces role-based access control

### Authentication Flow

```
Browser → Gateway → Keycloak (Login) → Gateway (JWT) → Action Manager Backend
```

### User Roles

- **ROLE_ADMIN** - Full access (create, read, update, delete)
- **ROLE_ACTION_MANAGER** - Create, read, update actions and jobs
- **ROLE_ACTION_VIEWER** - Read-only access to actions and statistics

### Configuration

Update `.env` file to point to the Gateway:

```env
# Development - route through Gateway
REACT_APP_ACTION_MANAGER_BACKEND_URL=http://localhost:6081/api/action-manager
```

For production, use `.env.production`:

```env
# Production - route through Gateway
REACT_APP_ACTION_MANAGER_BACKEND_URL=http://api-gateway:8081/api/action-manager
```

### Prerequisites

1. **Keycloak** running at `http://localhost:6080`
   - Realm: `pman-realm`
   - Client: `pman-client`
   - Users with appropriate roles configured

2. **Spring Cloud Gateway** running at `http://localhost:6081`
   - OAuth2 configured with Keycloak
   - Routes configured for action-manager

3. **Action Manager Backend** running at `http://localhost:6085`
   - JWT validation configured
   - Role-based authorization enabled

### First Time Setup

1. Access the application at `http://localhost:3000`
2. You'll be automatically redirected to Keycloak login
3. Login with your credentials (e.g., `manager@pman.local` / `manager123`)
4. After successful authentication, you'll be redirected back to the app
5. Your role determines what actions you can perform

### Session Management

- **Session timeout**: 30 minutes idle
- **Token refresh**: Automatic (handled by Gateway)
- **Logout**: Click logout button to end session in both app and Keycloak

### Troubleshooting

**Issue**: Redirected to login repeatedly
- **Solution**: Check that Keycloak is running and accessible at `http://localhost:6080`

**Issue**: 403 Forbidden errors
- **Solution**: Your user role doesn't have permission. Contact admin to assign proper role.

**Issue**: CORS errors
- **Solution**: Ensure Gateway and backend CORS configurations allow your origin

**Issue**: 401 Unauthorized after login
- **Solution**: Check JWT token validation in Gateway and backend logs

### Related

- Issue: [#187](https://github.com/hvantran/project-management/issues/187)
- Gateway PR: [base-platform](https://github.com/hvantran/base-platform/pull/new/feature/keycloak-authentication-187)
- Backend PR: [action-manager-app](https://github.com/hvantran/action-manager-app/pull/new/feature/keycloak-authentication-187)

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
