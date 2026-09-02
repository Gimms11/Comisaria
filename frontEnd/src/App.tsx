import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useWebSocketStore } from './stores/websocketStore';
import { useUiStore } from './stores/uiStore';
import { MainLayout } from './components/layout/MainLayout';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CrimeReportsView } from './components/reports/CrimeReportsView';
import { CommunityMapView } from './components/community/CommunityMapView';
import { GuidesAdminView } from './components/guides/GuidesAdminView';
import { OfficersView } from './components/officers/OfficersView';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth, officer } = useAuthStore();
  const { connect, disconnect } = useWebSocketStore();
  const { activeTab, setActiveTab } = useUiStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  // Si el rol actual no tiene acceso a la pestaña activa, resetear a dashboard
  const userRole = officer?.role || 'operador';
  const canAccessCrimeReports = ['admin', 'comisario', 'operador'].includes(userRole);
  const canAccessCommunityMap = ['admin', 'comisario', 'operador', 'moderador'].includes(userRole);
  const canAccessGuides = ['admin', 'comisario', 'moderador'].includes(userRole);
  const canAccessOfficers = ['admin', 'comisario'].includes(userRole);

  useEffect(() => {
    if (activeTab === 'guides' && !canAccessGuides) setActiveTab('dashboard');
    if (activeTab === 'officers' && !canAccessOfficers) setActiveTab('dashboard');
    if (activeTab === 'crime_reports' && !canAccessCrimeReports) setActiveTab('dashboard');
    if (activeTab === 'community_map' && !canAccessCommunityMap) setActiveTab('dashboard');
  }, [activeTab, userRole]);

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

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <MainLayout>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'crime_reports' && canAccessCrimeReports && <CrimeReportsView />}
      {activeTab === 'community_map' && canAccessCommunityMap && <CommunityMapView />}
      {activeTab === 'guides' && canAccessGuides && <GuidesAdminView />}
      {activeTab === 'officers' && canAccessOfficers && <OfficersView />}
    </MainLayout>
  );
};

export default App;
