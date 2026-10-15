import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import PublicLayout, { AppLayout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

import HomePage from './pages/home/HomePage';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import VoicePage from './pages/voice/VoicePage';
import TimerPage from './pages/timer/TimerPage';
import ReviewPage from './pages/review/ReviewPage';
import ManualPage from './pages/manual/ManualPage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import NotFound from './pages/NotFound/NotFound';

const RoutesComponent = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <Routes>
        {/* 公开页面 */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
        </Route>

        {/* 需登录页面 */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="voice" element={<VoicePage />} />
          <Route path="timer" element={<TimerPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="manual" element={<ManualPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default RoutesComponent;
