import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Queues from './pages/Queues';
import Jobs from './pages/Jobs';
import Workers from './pages/Workers';
import DLQ from './pages/DLQ';
import ScheduledJobs from './pages/ScheduledJobs';
import Logs from './pages/Logs';
import { orgsApi } from './api/client';
import { Loading } from './components/ui';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 2000 },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Guard component that checks if user has organizations
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  const { data: orgs, isLoading, error } = useQuery({
    queryKey: ['user-organizations-check'],
    queryFn: () => orgsApi.list().then(r => r.data),
    staleTime: 10000,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <Loading text="Loading workspace..." />
      </div>
    );
  }

  // If loading fails due to auth issues, clear token and send to login
  if (error) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // If user has zero organizations, redirect to onboarding flow
  if (!orgs || orgs.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

import { WorkspaceProvider } from './context/WorkspaceContext';

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <WorkspaceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <OnboardingGuard>
                <Layout />
              </OnboardingGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="queues" element={<Queues />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="workers" element={<Workers />} />
            <Route path="scheduled" element={<ScheduledJobs />} />
            <Route path="dlq" element={<DLQ />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<div style={{ padding: 20, color: '#6B7280' }}>Settings page coming soon.</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </WorkspaceProvider>
  </QueryClientProvider>
);

export default App;
