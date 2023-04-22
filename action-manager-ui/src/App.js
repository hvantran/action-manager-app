import { Stack, ThemeProvider } from '@mui/material';
import React from 'react';
import { Route, Routes } from "react-router-dom";
import PrimarySearchAppBar from './ResponsiveAppBar';
import { DEFAULT_THEME } from './components/GenericConstants';
import HomeContent from './components/HomeContent';
import ActionCreation from './components/actions/ActionCreation';
import ActionDetail from './components/actions/ActionDetail';
import ActionSummary from './components/actions/ActionSummary';
import ErrorPage from './components/common/ErrorPage';
import JobSummary from './components/jobs/JobSummary';


function App() {
  return (
    <ThemeProvider theme={DEFAULT_THEME}>
      <Stack spacing={4}>
        <PrimarySearchAppBar />
        <Routes>
          <Route path='/' element={<HomeContent />} errorElement={<ErrorPage />}></Route>
          <Route path='/actions' element={<ActionSummary />}></Route>
          <Route path='/actions/:actionId' element={<ActionDetail />}></Route>
          <Route path='/actions/new' element={<ActionCreation />}></Route>
          <Route path='jobs' element={<JobSummary />}></Route>
        </Routes>
      </Stack>
    </ThemeProvider>
  );
}
export default App;