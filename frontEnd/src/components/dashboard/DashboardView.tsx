import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import {
  CrimeReportListItem,
  CommunityReportListItem,
  GuideItem,
  Officer,
} from '../../types';
import { useWebSocketStore } from '../../stores/websocketStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { DashboardUrgentBanner } from './DashboardUrgentBanner';
import { DashboardRoleHeader } from './DashboardRoleHeader';
import { DashboardKpiGrid } from './DashboardKpiGrid';
import { DashboardRecentCrimesCard } from './DashboardRecentCrimesCard';
import { DashboardRecentCommunityCard } from './DashboardRecentCommunityCard';
import { DashboardRecentGuidesCard } from './DashboardRecentGuidesCard';

export const DashboardView: React.FC = () => {
  const { alerts, latestAlert } = useWebSocketStore();
  const { officer } = useAuthStore();
  const { setActiveTab, openCrimeReportModal, openCommunityReportModal } = useUiStore();

  const role = officer?.role || 'operador';

  const [crimeReports, setCrimeReports] = useState<CrimeReportListItem[]>([]);
  const [communityReports, setCommunityReports] = useState<CommunityReportListItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const promises: Promise<any>[] = [];

      // 1. Delitos policiales (admin, comisario, operador)
      const canFetchCrimes = ['admin', 'comisario', 'operador'].includes(role);
      if (canFetchCrimes) {
        promises.push(api.listCrimeReports({ limit: 50 }));
      } else {
        promises.push(Promise.resolve({ items: [] }));
      }

      // 2. Reportes comunitarios (todos los roles)
      promises.push(api.listCommunityReports({ limit: 50 }));

      // 3. Guías (admin, comisario, moderador)
      const canFetchGuides = ['admin', 'comisario', 'moderador'].includes(role);
      if (canFetchGuides) {
        promises.push(api.listAdminGuides());
      } else {
        promises.push(Promise.resolve([]));
      }

      // 4. Dotación policial (admin, comisario)
      const canFetchOfficers = ['admin', 'comisario'].includes(role);
      if (canFetchOfficers) {
        promises.push(api.listOfficers());
      } else {
        promises.push(Promise.resolve([]));
      }

      const [crimeRes, communityRes, guidesRes, officersRes] = await Promise.all(promises);

      setCrimeReports(crimeRes?.items || []);
      setCommunityReports(communityRes?.items || []);
      setGuides(Array.isArray(guidesRes) ? guidesRes : []);
      setOfficers(Array.isArray(officersRes) ? officersRes : []);
    } catch (e) {
      console.warn('Fallo al cargar datos del dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Recarga reactiva en tiempo real al ingresar nuevo reporte o cambio de estado
  useEffect(() => {
    if (latestAlert) {
      loadData();
    }
  }, [latestAlert]);

  const safeCrimeReports = crimeReports || [];
  const safeCommunityReports = communityReports || [];
  const safeGuides = guides || [];
  const safeOfficers = officers || [];

  const urgentCount = safeCrimeReports.filter(
    (r) => r.priority === 'urgente' || r.is_emergency
  ).length;
  const pendingCount = safeCrimeReports.filter((r) => r.status === 'pendiente').length;
  const inProgressCount = safeCrimeReports.filter(
    (r) => r.status === 'en_revision' || r.status === 'en_atencion'
  ).length;
  const communityTotal = safeCommunityReports.length;
  const communityPending = safeCommunityReports.filter((r) => r.status === 'pendiente').length;
  const totalShares = safeCommunityReports.reduce((acc, r) => acc + (r.shares_count || 0), 0);
  const publishedGuidesCount = safeGuides.filter((g) => g.is_published).length;
  const activeOfficersCount = safeOfficers.filter((o) => o.is_active).length;

  // Denuncia SOS activa: únicamente si existe un reporte SOS no resuelto y con antigüedad <= 1 día (24h)
  const activeSosReport = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // 1. Buscar en los reportes reales de la base de datos
    const fromDb = safeCrimeReports.find((r) => {
      const isSos = r.is_emergency || r.priority === 'urgente';
      const isUnresolved =
        r.status !== 'resuelto' &&
        r.status !== 'archivado' &&
        r.status !== 'rechazado';
      const createdAtMs = new Date(r.created_at).getTime();
      const isWithinOneDay = !isNaN(createdAtMs) && createdAtMs >= oneDayAgo;
      return isSos && isUnresolved && isWithinOneDay;
    });

    if (fromDb) {
      return {
        id: fromDb.id,
        public_code: fromDb.public_code,
        category_name: fromDb.category_name,
        timestamp: fromDb.created_at,
      };
    }

    // 2. Si acaba de llegar por WebSocket y cumple las condiciones (urgente, no resuelto, < 24h)
    const recentLiveSos = alerts.find((a) => {
      const isSos = a.priority === 'urgente' || a.extra_data?.is_emergency;
      const status = a.extra_data?.status || a.extra_data?.new_status || 'pendiente';
      const isUnresolved = status !== 'resuelto' && status !== 'archivado' && status !== 'rechazado';
      const createdAtMs = new Date(a.timestamp).getTime();
      const isWithinOneDay = !isNaN(createdAtMs) && createdAtMs >= oneDayAgo;
      return isSos && isUnresolved && isWithinOneDay && a.event_type !== 'STATUS_CHANGED';
    });

    if (recentLiveSos) {
      return {
        id: recentLiveSos.extra_data?.report_id || recentLiveSos.public_code,
        public_code: recentLiveSos.public_code,
        category_name: recentLiveSos.category_name,
        timestamp: recentLiveSos.timestamp,
      };
    }

    return null;
  }, [safeCrimeReports, alerts]);

  return (
    <div className="flex-1 flex flex-col gap-4 sm:gap-5 text-left w-full h-auto pb-8">
      {/* Top Banner: Emergency Ticker solo si hay denuncia SOS activa no resuelta (< 24h) */}
      {activeSosReport && role !== 'moderador' && (
        <DashboardUrgentBanner
          alert={activeSosReport}
          onIntervene={() => {
            if (activeSosReport.id) {
              openCrimeReportModal(activeSosReport.id);
            } else {
              setActiveTab('crime_reports');
            }
          }}
        />
      )}

      {/* Role Banner Descriptor */}
      <DashboardRoleHeader role={role} onNavigate={setActiveTab} />

      {/* KPI Cards Grid */}
      <DashboardKpiGrid
        role={role}
        urgentCount={urgentCount}
        inProgressCount={inProgressCount}
        pendingCount={pendingCount}
        activeOfficersCount={activeOfficersCount}
        communityTotal={communityTotal}
        communityPending={communityPending}
        publishedGuidesCount={publishedGuidesCount}
        totalGuidesCount={safeGuides.length}
        totalShares={totalShares}
        onNavigate={setActiveTab}
      />

      {/* Operational Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full">
        {role === 'moderador' ? (
          <>
            <div className="lg:col-span-7 flex flex-col">
              <DashboardRecentCommunityCard
                communityReports={safeCommunityReports}
                isLoading={isLoading}
                onSelectReport={openCommunityReportModal}
                onViewAll={() => setActiveTab('community_map')}
                isModeratorView
              />
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <DashboardRecentGuidesCard
                guides={safeGuides}
                onNavigate={() => setActiveTab('guides')}
              />
            </div>
          </>
        ) : (
          <>
            <div className="lg:col-span-7 flex flex-col">
              <DashboardRecentCrimesCard
                crimeReports={safeCrimeReports}
                isLoading={isLoading}
                onSelectReport={openCrimeReportModal}
                onViewAll={() => setActiveTab('crime_reports')}
              />
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <DashboardRecentCommunityCard
                communityReports={safeCommunityReports}
                isLoading={isLoading}
                onSelectReport={openCommunityReportModal}
                onViewAll={() => setActiveTab('community_map')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
