import React from 'react';
import { Route, Routes } from 'react-router-dom';

import QueryProvider from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomeLayoutProvider } from './contexts/HomeLayoutContext';
import AppLayout from './components/AppLayout';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TasksPage from './pages/Tasks/TasksPage';
import GrowthPage from './pages/Growth/GrowthPage';
import FocusPage from './pages/Focus/FocusPage';
import StatsPage from './pages/Stats/StatsPage';
import ReviewPage from './pages/Review/ReviewPage';
import CommunityPage from './pages/Community/CommunityPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotFound from './pages/NotFound/NotFound';
import { startWatermarkStripper } from '@client/src/utils/watermark-stripper';

startWatermarkStripper();

const RoutesComponent = () => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <HomeLayoutProvider>
          <AuthProvider>
        <Routes>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route path="app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="growth" element={<GrowthPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
        </Routes>
          </AuthProvider>
        </HomeLayoutProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default RoutesComponent;
