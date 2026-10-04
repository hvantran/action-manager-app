import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import {
  ThemeProvider,
  useTheme,
  ErrorPageTemplate,
  AppFooter,
  Spinner,
} from '@hvantran/ui-component-library';

import ActionCreation from './components/actions/ActionCreation';
import ActionDetail from './components/actions/ActionDetail';
import ActionSummary from './components/actions/ActionSummary';
import JobCreation from './components/jobs/JobCreation';
import JobDetail from './components/jobs/JobDetail';
import JobSummary from './components/jobs/JobSummary';
import PrimarySearchAppBar from './ResponsiveAppBar';
import { useUserInfo } from './hooks/useUserInfo';

const GATEWAY_BASE_URL =
  window._env_?.REACT_APP_GATEWAY_URL ??
  process.env.REACT_APP_GATEWAY_URL ??
  (
    window._env_?.REACT_APP_ACTION_MANAGER_BACKEND_URL ??
    process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL ??
    'http://localhost:6081/api/action-manager'
  ).replace('/api/action-manager', '');

function AppContent() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { userInfo, loading } = useUserInfo();

  // Redirect to Gateway login if not authenticated (after loading completes)
  React.useEffect(() => {
    if (!loading && !userInfo.authenticated) {
      const currentOrigin = window.location.origin;
      window.location.href = `${GATEWAY_BASE_URL}/oauth2/authorization/keycloak?redirect_uri=${encodeURIComponent(
        currentOrigin
      )}`;
    }
  }, [loading, userInfo.authenticated]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-surface-ground-light dark:bg-surface-ground-dark text-secondary-900 dark:text-secondary-100">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-secondary-500">Loading...</p>
      </div>
    );
  }

  // Render nothing while redirect is pending
  if (!userInfo.authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-ground-light dark:bg-surface-ground-dark text-secondary-900 dark:text-secondary-100 font-sans">
      <PrimarySearchAppBar
        toggleDarkMode={resolvedTheme === 'dark'}
        setToggleDarkMode={toggleTheme}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/actions" />}
            errorElement={<ErrorPageTemplate title="Not Found" message="Page not found" />}
          />
          <Route path="/actions" element={<ActionSummary />} />
          <Route path="/actions/new" element={<ActionCreation />} />
          <Route path="/actions/:actionId" element={<ActionDetail />} />
          <Route path="/actions/:actionId/jobs/new" element={<JobCreation />} />
          <Route path="/actions/:actionId/jobs/:jobId" element={<JobDetail />} />
          <Route path="/jobs" element={<JobSummary />} />
          <Route path="/jobs/new" element={<JobCreation />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
        </Routes>
      </main>
      <AppFooter
        appName="Action Manager"
        statusText="All systems operational"
        isOnline={true}
      />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="action-manager-enable-dark-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
