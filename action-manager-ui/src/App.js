import { Box, Stack, ThemeProvider, CssBaseline, CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import ActionCreation from './components/actions/ActionCreation';
import ActionDetail from './components/actions/ActionDetail';
import ActionSummary from './components/actions/ActionSummary';
import ErrorPage from './components/common/ErrorPage';
import Footer from './components/common/Footer';
import { DARK_THEME, DEFAULT_THEME, LocalStorageService } from './components/GenericConstants';
import JobCreation from './components/jobs/JobCreation';
import JobDetail from './components/jobs/JobDetail';
import JobSummary from './components/jobs/JobSummary';
import PrimarySearchAppBar from './ResponsiveAppBar';
import { useUserInfo } from './hooks/useUserInfo';

const selectThemeStorageKey = 'action-manager-enable-dark-theme';

const GATEWAY_BASE_URL = (
  window._env_?.REACT_APP_ACTION_MANAGER_BACKEND_URL ??
  process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL ??
  'http://localhost:6081/api/action-manager'
).replace('/api/action-manager', '');

function App() {
  const [toggleDarkMode, setToggleDarkMode] = React.useState(
    LocalStorageService.getOrDefault(selectThemeStorageKey, false) === 'true'
  );
  const { userInfo, loading } = useUserInfo();

  const switchTheme = () => {
    setToggleDarkMode((previous) => {
      LocalStorageService.put(selectThemeStorageKey, !previous);
      return !previous;
    });
  };

  //Redirect to Gateway login if not authenticated (after loading completes)
  React.useEffect(() => {
    if (!loading && !userInfo.authenticated) {
      // Save current origin to redirect back after OAuth2 login
      const currentOrigin = window.location.origin;
      window.location.href = `${GATEWAY_BASE_URL}/oauth2/authorization/keycloak?redirect_uri=${encodeURIComponent(currentOrigin)}`;
    }
  }, [loading, userInfo.authenticated]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <ThemeProvider theme={!toggleDarkMode ? DEFAULT_THEME : DARK_THEME}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Render nothing while redirect is pending
  if (!userInfo.authenticated) {
    return null;
  }

  return (
    <ThemeProvider theme={!toggleDarkMode ? DEFAULT_THEME : DARK_THEME}>
      <CssBaseline />
      <Stack className="min-h-screen bg-gray-50" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <PrimarySearchAppBar toggleDarkMode={toggleDarkMode} setToggleDarkMode={switchTheme} />
        <Box className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6" sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/actions" />} errorElement={<ErrorPage />}></Route>
            <Route path="/actions" element={<ActionSummary />}></Route>
            <Route path="/actions/:actionId" element={<ActionDetail />}></Route>
            <Route path="/actions/:actionId/jobs/new" element={<JobCreation />}></Route>
            <Route path="/actions/:actionId/jobs/:jobId" element={<JobDetail />}></Route>
            <Route path="/actions/new" element={<ActionCreation />}></Route>
            <Route path="jobs" element={<JobSummary />}></Route>
          </Routes>
        </Box>
        <Footer />
      </Stack>
      <ToastContainer />
    </ThemeProvider>
  );
}
export default App;
