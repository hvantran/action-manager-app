import { Stack, ThemeProvider } from '@mui/material'
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import PrimarySearchAppBar from './ResponsiveAppBar'
import { DEFAULT_THEME } from './components/GenericConstants'
import HomeContent from './components/HomeContent'
import ActionCreation from './components/actions/ActionCreation'
import ActionDetail from './components/actions/ActionDetail'
import ActionSummary from './components/actions/ActionSummary'
import ActionArchive from './components/actions/ActionArchive'
import ErrorPage from './components/common/ErrorPage'
import JobSummary from './components/jobs/JobSummary'
import JobCreation from './components/jobs/JobCreation'
import JobDetail from './components/jobs/JobDetail'
import { ToastContainer } from 'react-toastify'

function App () {
  window._env_ = {}
  return (
    <ThemeProvider theme={DEFAULT_THEME}>
      <Stack spacing={4}>
        <PrimarySearchAppBar />
        <Routes>
          <Route
            path='/'
            element={<HomeContent />}
            errorElement={<ErrorPage />}
          ></Route>
          <Route path='/actions' element={<ActionSummary />}></Route>
          <Route path='/actions/archive' element={<ActionArchive />}></Route>
          <Route path='/actions/:actionId' element={<ActionDetail />}></Route>
          <Route
            path='/actions/:actionId/jobs/new'
            element={<JobCreation />}
          ></Route>
          <Route
            path='/actions/:actionId/jobs/:jobId'
            element={<JobDetail />}
          ></Route>
          <Route path='/actions/new' element={<ActionCreation />}></Route>
          <Route path='jobs' element={<JobSummary />}></Route>
        </Routes>
      </Stack>
      <ToastContainer />
    </ThemeProvider>
  )
}
export default App
