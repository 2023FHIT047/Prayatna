import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CommunityDashboard from './pages/CommunityDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ResourceManagerDashboard from './pages/ResourceManagerDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPersonnelAllocation from './pages/AdminPersonnelAllocation';
import AdminVolunteerVerification from './pages/AdminVolunteerVerification';
import AdminDatabaseSync from './pages/AdminDatabaseSync';
import AdminSQLConsole from './pages/AdminSQLConsole';
import SystemReset from './pages/SystemReset';
import LiveMap from './pages/LiveMap';
import ReportIncident from './pages/ReportIncident';
import Reviews from './pages/Reviews';
import NotFound from './pages/NotFound';
import NotificationFeed from './components/layout/NotificationFeed';
import PrototypeSwitcher from './components/layout/PrototypeSwitcher';

const queryClient = new QueryClient();

const RootRoute = () => {
  const { role } = useAuth();
  if (role) return <Navigate to="/dashboard" replace />;
  return <Index />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <NotificationFeed />
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/personnel" element={<AdminPersonnelAllocation />} />
              <Route path="/admin/volunteers" element={<AdminVolunteerVerification />} />
              <Route path="/admin/sync" element={<AdminDatabaseSync />} />
              <Route path="/admin/console" element={<AdminSQLConsole />} />
              <Route path="/admin/reset" element={<SystemReset />} />
              <Route path="/community" element={<CommunityDashboard />} />
              <Route path="/coordinator" element={<CoordinatorDashboard />} />
              <Route path="/volunteer" element={<VolunteerDashboard />} />
              <Route path="/resources" element={<ResourceManagerDashboard />} />
              <Route path="/map" element={<LiveMap />} />
              <Route path="/report" element={<ReportIncident />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;