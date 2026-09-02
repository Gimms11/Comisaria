import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  MapPin,
  BookOpen,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  FileText,
  Eye,
  Users,
  Share2,
  Video,
  ChevronRight,
  Layers,
} from 'lucide-react';
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
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatTimeAgo, getPriorityStyles, getStatusStyles } from '../../lib/utils';

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

      // 1. Delitos policiales (solo admin, comisario, operador)
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

  // Recalcular métricas seguras
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

  return (
    <div className="flex-1 flex flex-col justify-between gap-3 text-left w-full h-full min-h-0">
      {/* Top Banner: Emergency Ticker (Policía / Guardia) if active */}
      {alerts.length > 0 && alerts[0].priority === 'urgente' && role !== 'moderador' && (
        <div className="p-2.5 px-3.5 rounded-xl bg-gradient-to-r from-red-950/90 via-red-900/70 to-slate-900 border border-red-500/50 shadow-lg flex items-center justify-between gap-3 animate-in fade-in shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-red-600 text-white radar-emergency shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 font-mono whitespace-nowrap">
                ALERTA SOS
              </span>
              <span className="text-xs text-white font-semibold truncate">
                {alerts[0].public_code} • {alerts[0].category_name}
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline whitespace-nowrap">
                ({formatTimeAgo(alerts[0].timestamp)})
              </span>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (alerts[0].extra_data?.report_id) {
                openCrimeReportModal(alerts[0].extra_data.report_id);
              } else {
                setActiveTab('crime_reports');
              }
            }}
            className="text-xs py-1 px-2.5 whitespace-nowrap shrink-0"
          >
            Intervenir <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Role Banner Descriptor - Compact single-row layout */}
      <div className="p-3 px-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-[11px] whitespace-nowrap shrink-0 ${
              role === 'admin'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : role === 'comisario'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : role === 'operador'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}
          >
            {role.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              {role === 'admin' && 'Centro de Mando Integral y Auditoría'}
              {role === 'comisario' && 'Puesto de Comando y Dirección Operativa'}
              {role === 'operador' && 'Consola Táctica de Guardia y Despacho'}
              {role === 'moderador' && 'Centro de Participación Vecinal y Contenido Cívico'}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono truncate hidden sm:block">
              {role === 'admin' && 'Supervisión total de seguridad, dotación policial y gestión de microservicios'}
              {role === 'comisario' && 'Monitoreo estratégico, directivas de despacho y coordinación distrital'}
              {role === 'operador' && 'Atención inmediata de denuncias, radar de emergencias y mesa de partes'}
              {role === 'moderador' && 'Canalización de reportes vecinales a Serenazgo y edición de guías ciudadanas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {['admin', 'comisario', 'operador'].includes(role) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('crime_reports')}
              className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" /> Delitos (MS-02)
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('community_map')}
            className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-400" /> Mapa Vecinal (MS-03)
          </Button>
          {['admin', 'comisario', 'moderador'].includes(role) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('guides')}
              className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Guías Cívicas
            </Button>
          )}
          {['admin', 'comisario'].includes(role) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('officers')}
              className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Dotación PNP
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid - Compact and responsive, fixed height footprint */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        {role === 'moderador' ? (
          <>
            <Card
              onClick={() => setActiveTab('community_map')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-purple-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">INCIDENTES VECINALES</span>
                <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{communityTotal}</span>
                  <p className="text-[10px] text-purple-400 font-medium truncate">Reportes registrados</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </Card>

            <Card
              onClick={() => setActiveTab('community_map')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-amber-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">PENDIENTES SERENAZGO</span>
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{communityPending}</span>
                  <p className="text-[10px] text-amber-400 font-medium truncate">Por canalizar</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </Card>

            <Card
              onClick={() => setActiveTab('guides')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-emerald-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">GUÍAS PUBLICADAS</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{publishedGuidesCount}</span>
                  <p className="text-[10px] text-emerald-400 font-medium truncate">De {safeGuides.length} guías</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Card>

            <Card
              onClick={() => setActiveTab('community_map')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-sky-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">DIFUSIÓN COMUNITARIA</span>
                <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:scale-110 transition-transform">
                  <Share2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{totalShares}</span>
                  <p className="text-[10px] text-sky-400 font-medium truncate">Vecinos involucrados</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card
              onClick={() => setActiveTab('crime_reports')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-red-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">URGENCIAS ACTIVAS</span>
                <div className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{urgentCount}</span>
                  <p className="text-[10px] text-red-400 font-medium truncate">Prioridad Inmediata / SOS</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-400 transition-colors" />
              </div>
            </Card>

            <Card
              onClick={() => setActiveTab('crime_reports')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-sky-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">EN ATENCIÓN / TURNO</span>
                <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{inProgressCount}</span>
                  <p className="text-[10px] text-sky-400 font-medium truncate">En proceso operativo</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </div>
            </Card>

            <Card
              onClick={() => setActiveTab('crime_reports')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-amber-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">PENDIENTES DE REVISIÓN</span>
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">{pendingCount}</span>
                  <p className="text-[10px] text-amber-400 font-medium truncate">Mesa de partes / guardia</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </Card>

            <Card
              onClick={() => setActiveTab(['admin', 'comisario'].includes(role) ? 'officers' : 'community_map')}
              className="glass-card-hover bg-slate-900/80 border-slate-800 p-3 sm:p-3.5 cursor-pointer hover:border-purple-500/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 font-mono truncate">
                  {['admin', 'comisario'].includes(role) ? 'DOTACIÓN POLICIAL' : 'REPORTES VECINALES'}
                </span>
                <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
                  {['admin', 'comisario'].includes(role) ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-white font-heading">
                    {['admin', 'comisario'].includes(role) ? activeOfficersCount : communityTotal}
                  </span>
                  <p className="text-[10px] text-purple-400 font-medium truncate">
                    {['admin', 'comisario'].includes(role)
                      ? 'Efectivos activos registrados'
                      : 'Incidentes Serenazgo'}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Operational Feeds Grid - Max 3 items per list + Complete View Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 flex-1 min-h-0">
        {role === 'moderador' ? (
          <>
            {/* Moderador Izquierda: Reportes Urbanos & Serenazgo (7 cols) */}
            <div className="lg:col-span-7 flex flex-col min-h-0">
              <Card className="bg-slate-900/90 border-slate-800/90 flex-1 flex flex-col justify-between p-3.5 min-h-0">
                <div className="min-h-0 flex flex-col">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                        Bandeja Vecinal & Serenazgo (MS-03)
                      </h3>
                    </div>
                    <span className="text-[11px] text-purple-400 font-mono font-semibold">
                      {safeCommunityReports.length} reportes
                    </span>
                  </div>

                  <div className="space-y-2 min-h-0 overflow-hidden">
                    {isLoading ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-mono">
                        Cargando reportes vecinales...
                      </div>
                    ) : safeCommunityReports.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Sin reportes vecinales activos
                      </p>
                    ) : (
                      safeCommunityReports.slice(0, 3).map((report) => (
                        <div
                          key={report.id}
                          onClick={() => openCommunityReportModal(report.public_code)}
                          className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-purple-400 whitespace-nowrap">
                                {report.public_code}
                              </span>
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 whitespace-nowrap shrink-0">
                                {report.category_name}
                              </Badge>
                              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                {formatTimeAgo(report.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                              {report.description}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              {report.address_reference || 'Sector La Tinguiña'} •{' '}
                              <span className="text-purple-400 font-semibold">
                                {report.shares_count} difusión(es)
                              </span>
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                            <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('community_map')}
                    className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-purple-300"
                  >
                    Ver Mapa Comunitario Completo ({safeCommunityReports.length} reportes) <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Moderador Derecha: Biblioteca Editorial de Guías (5 cols) */}
            <div className="lg:col-span-5 flex flex-col min-h-0">
              <Card className="bg-slate-900/90 border-slate-800/90 flex-1 flex flex-col justify-between p-3.5 min-h-0">
                <div className="min-h-0 flex flex-col">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                        Guías Cívicas TikTok (MS-04)
                      </h3>
                    </div>
                    <span className="text-[11px] text-sky-400 font-mono font-semibold">
                      {safeGuides.length} guías
                    </span>
                  </div>

                  <div className="space-y-2 min-h-0 overflow-hidden">
                    {safeGuides.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        No hay guías registradas
                      </p>
                    ) : (
                      safeGuides.slice(0, 3).map((guide) => (
                        <div
                          key={guide.id}
                          onClick={() => setActiveTab('guides')}
                          className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                                  guide.is_published
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {guide.is_published ? 'PUBLICADA' : 'BORRADOR'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                {guide.duration_seconds}s
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-white truncate mt-1">
                              {guide.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{guide.summary}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('guides')}
                    className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-sky-300"
                  >
                    Gestionar Biblioteca de Guías ({safeGuides.length}) <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Policía / Admin / Operador Izquierda: Delitos Recientes (7 cols) */}
            <div className="lg:col-span-7 flex flex-col min-h-0">
              <Card className="bg-slate-900/90 border-slate-800/90 flex-1 flex flex-col justify-between p-3.5 min-h-0">
                <div className="min-h-0 flex flex-col">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-sky-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                        Bandeja de Delitos Recientes (MS-02)
                      </h3>
                    </div>
                    <span className="text-[11px] text-sky-400 font-mono font-semibold">
                      {safeCrimeReports.length} casos totales
                    </span>
                  </div>

                  <div className="space-y-2 min-h-0 overflow-hidden">
                    {isLoading ? (
                      <div className="text-center py-6 text-slate-500 text-xs font-mono">
                        Cargando denuncias anónimas...
                      </div>
                    ) : safeCrimeReports.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        No hay denuncias registradas en la comisaría.
                      </div>
                    ) : (
                      safeCrimeReports.slice(0, 4).map((report) => {
                        const statusStyle = getStatusStyles(report.status);

                        return (
                          <div
                            key={report.id}
                            onClick={() => openCrimeReportModal(report.id)}
                            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.003]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-2.5 h-9 rounded-full shrink-0 ${
                                  report.priority === 'urgente'
                                    ? 'bg-red-500'
                                    : report.priority === 'alta'
                                    ? 'bg-amber-500'
                                    : 'bg-sky-500'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-xs text-sky-400 tracking-wider whitespace-nowrap">
                                    {report.public_code}
                                  </span>
                                  <Badge
                                    variant={report.priority === 'urgente' ? 'urgent' : 'default'}
                                    className="text-[10px] py-0 px-1.5 whitespace-nowrap shrink-0"
                                  >
                                    {report.category_name}
                                  </Badge>
                                  {report.is_emergency && (
                                    <Badge variant="urgent" pulse className="text-[10px] py-0 px-1.5 whitespace-nowrap shrink-0">
                                      SOS
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-auto sm:ml-0">
                                    {formatTimeAgo(report.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                                  {report.description}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                  {report.address_reference || 'La Tinguiña, Ica'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${statusStyle.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />
                                {statusStyle.label}
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ver detalle">
                                <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('crime_reports')}
                    className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-sky-300"
                  >
                    Ver Bandeja Completa de Delitos ({safeCrimeReports.length} casos) <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Policía / Admin / Operador Derecha: Reportes Vecinales (5 cols) */}
            <div className="lg:col-span-5 flex flex-col min-h-0">
              <Card className="bg-slate-900/90 border-slate-800/90 flex-1 flex flex-col justify-between p-3.5 min-h-0">
                <div className="min-h-0 flex flex-col">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                        Reportes Urbanos y Serenazgo (MS-03)
                      </h3>
                    </div>
                    <span className="text-[11px] text-purple-400 font-mono font-semibold">
                      {safeCommunityReports.length} registros
                    </span>
                  </div>

                  <div className="space-y-2 min-h-0 overflow-hidden">
                    {safeCommunityReports.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Sin reportes vecinales activos
                      </p>
                    ) : (
                      safeCommunityReports.slice(0, 3).map((report) => (
                        <div
                          key={report.id}
                          onClick={() => openCommunityReportModal(report.public_code)}
                          className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800/80 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-purple-400 whitespace-nowrap">
                              {report.public_code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                              {formatTimeAgo(report.created_at)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate mt-0.5">
                            {report.category_name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {report.description}
                          </p>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                            <span className="truncate max-w-[140px]">{report.address_reference || 'Sector Tinguiña'}</span>
                            <span className="text-purple-400 font-semibold whitespace-nowrap shrink-0">
                              {report.shares_count} difusión(es)
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('community_map')}
                    className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-purple-300"
                  >
                    Ver en Mapa Vecinal ({safeCommunityReports.length} reportes) <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
