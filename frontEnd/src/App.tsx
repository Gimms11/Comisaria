import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useWebSocketStore } from './stores/websocketStore';
import { useUiStore, ActiveTab } from './stores/uiStore';
import { MainLayout } from './components/layout/MainLayout';
import { LoginView } from './components/auth/LoginView';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardView } from './components/dashboard/DashboardView';
import { CrimeReportsView } from './components/reports/CrimeReportsView';
import { CommunityMapView } from './components/community/CommunityMapView';
import { GuidesAdminView } from './components/guides/GuidesAdminView';
import { OfficersView } from './components/officers/OfficersView';

const tabToPath: Record<ActiveTab, string> = {
  dashboard: '/dashboard',
  crime_reports: '/delitos',
  community_map: '/mapa',
  guides: '/guias',
  officers: '/oficiales',
};

const pathToTab: Record<string, ActiveTab> = {
  '/dashboard': 'dashboard',
  '/delitos': 'crime_reports',
  '/mapa': 'community_map',
  '/guias': 'guides',
  '/oficiales': 'officers',
};

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { connect, disconnect } = useWebSocketStore();
  const { activeTab, setActiveTab } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  // Sync URL changes to uiStore activeTab
  useEffect(() => {
    const currentTab = pathToTab[location.pathname];
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [location.pathname]);

  // Sync uiStore activeTab changes to URL
  useEffect(() => {
    const targetPath = tabToPath[activeTab];
    if (targetPath && location.pathname !== targetPath && location.pathname !== '/login') {
      navigate(targetPath, { replace: false });
    }
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 animate-pulse flex items-center justify-center text-white font-bold font-mono">
          PNP
        </div>
        <p className="text-xs font-mono tracking-wider">Cargando Centro de Control...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView />
        }
      />

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardView />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/delitos"
        element={
          <ProtectedRoute allowedRoles={['admin', 'comisario', 'operador']}>
            <MainLayout>
              <CrimeReportsView />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mapa"
        element={
          <ProtectedRoute allowedRoles={['admin', 'comisario', 'operador', 'moderador']}>
            <MainLayout>
              <CommunityMapView />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/guias"
        element={
          <ProtectedRoute allowedRoles={['admin', 'comisario', 'moderador']}>
            <MainLayout>
              <GuidesAdminView />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/oficiales"
        element={
          <ProtectedRoute allowedRoles={['admin', 'comisario']}>
            <MainLayout>
              <OfficersView />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
