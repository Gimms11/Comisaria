import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  MapPin,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Radio,
  FileText,
  Eye,
  Users,
  Share2,
  ShieldCheck,
  Video,
  Plus,
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
  const { alerts } = useWebSocketStore();
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
        promises.push(api.listCrimeReports({ limit: 6 }));
      } else {
        promises.push(Promise.resolve({ items: [] }));
      }

      // 2. Reportes comunitarios (todos los roles)
      promises.push(api.listCommunityReports({ limit: 6 }));

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
    <div className="space-y-6 text-left">
      {/* Top Banner: Emergency Ticker (Policía / Guardia) */}
      {alerts.length > 0 && alerts[0].priority === 'urgente' && role !== 'moderador' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-slate-900 border border-red-500/50 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white radar-emergency">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-red-400 font-mono">
                  🚨 ALERTA TÁCTICA PRIORITARIA DESPACHADA
                </span>
                <span className="text-xs text-slate-300">
                  Código: <strong className="text-white">{alerts[0].public_code}</strong>
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {alerts[0].category_name} - Reportado {formatTimeAgo(alerts[0].timestamp)}
              </p>
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
          >
            Intervenir Caso <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Role Banner Descriptor */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border font-mono font-bold text-xs ${
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
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {role === 'admin' && 'Centro de Mando Integral & Auditoría'}
              {role === 'comisario' && 'Puesto de Comando & Dirección Operativa'}
              {role === 'operador' && 'Consola Táctica de Guardia & Despacho'}
              {role === 'moderador' && 'Centro de Participación Vecinal & Contenido Cívico'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {role === 'admin' && 'Supervisión total de seguridad, dotación policial y gestión de microservicios'}
              {role === 'comisario' && 'Monitoreo estratégico, directivas de despacho y coordinación distrital'}
              {role === 'operador' && 'Atención inmediata de denuncias, radar de emergencias y mesa de partes'}
              {role === 'moderador' && 'Canalización de reportes vecinales a Serenazgo y edición de guías ciudadanas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['admin', 'comisario'].includes(role) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('officers')}
              className="text-xs gap-1.5 border-slate-700 bg-slate-950/60"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" /> Dotación Policial
            </Button>
          )}
          {['admin', 'comisario', 'moderador'].includes(role) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('guides')}
              className="text-xs gap-1.5 border-slate-700 bg-slate-950/60"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Biblioteca Cívica
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid - Adaptadas según el rol */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'moderador' ? (
          <>
            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">INCIDENTES VECINALES</span>
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{communityTotal}</span>
                <span className="text-xs text-purple-400 font-medium">Reportes registrados</span>
              </div>
            </Card>

            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">PENDIENTES SERENAZGO</span>
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{communityPending}</span>
                <span className="text-xs text-amber-400 font-medium">Por canalizar</span>
              </div>
            </Card>

            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">GUÍAS PUBLICADAS</span>
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Video className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{publishedGuidesCount}</span>
                <span className="text-xs text-emerald-400 font-medium">De {safeGuides.length} guías</span>
              </div>
            </Card>

            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">DIFUSIÓN COMUNITARIA</span>
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{totalShares}</span>
                <span className="text-xs text-sky-400 font-medium">Vecinos involucrados</span>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">URGENCIAS ACTIVAS</span>
                <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{urgentCount}</span>
                <span className="text-xs text-red-400 font-medium">Prioridad Inmediata / SOS</span>
              </div>
            </Card>

            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">EN ATENCIÓN / TURNO</span>
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{inProgressCount}</span>
                <span className="text-xs text-sky-400 font-medium">En proceso operativo</span>
              </div>
            </Card>

            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">PENDIENTES DE REVISIÓN</span>
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">{pendingCount}</span>
                <span className="text-xs text-amber-400 font-medium">Mesa de partes / guardia</span>
              </div>
            </Card>

            <Card className="glass-card-hover bg-slate-900/80 border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  {['admin', 'comisario'].includes(role) ? 'DOTACIÓN POLICIAL' : 'REPORTES VECINALES'}
                </span>
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {['admin', 'comisario'].includes(role) ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-heading">
                  {['admin', 'comisario'].includes(role) ? activeOfficersCount : communityTotal}
                </span>
                <span className="text-xs text-purple-400 font-medium">
                  {['admin', 'comisario'].includes(role)
                    ? 'Efectivos activos registrados'
                    : 'Incidentes Serenazgo'}
                </span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Grid: Renderizado según el rol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {role === 'moderador' ? (
          <>
            {/* Moderador Izquierda: Reportes Urbanos & Serenazgo (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="bg-slate-900/90 border-slate-800/90">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <CardTitle>Bandeja Vecinal & Derivación a Serenazgo (MS-03)</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('community_map')}
                    className="text-xs"
                  >
                    Ver Mapa <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </CardHeader>

                <div className="space-y-3">
                  {isLoading ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      Cargando reportes vecinales...
                    </div>
                  ) : safeCommunityReports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">
                      Sin reportes vecinales activos
                    </p>
                  ) : (
                    safeCommunityReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => openCommunityReportModal(report.public_code)}
                        className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-all flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-purple-400">
                              {report.public_code}
                            </span>
                            <Badge variant="default">{report.category_name}</Badge>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {formatTimeAgo(report.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium truncate mt-1">
                            {report.description}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {report.address_reference || 'Sector La Tinguiña'} •{' '}
                            <span className="text-purple-400 font-semibold">
                              {report.shares_count} difusión(es)
                            </span>
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Moderador Derecha: Biblioteca Editorial de Guías (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="bg-slate-900/90 border-slate-800/90">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-400" />
                    <CardTitle>Guías & Contenido Cívico (MS-04)</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('guides')}
                    className="text-xs"
                  >
                    Gestionar <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </CardHeader>

                <div className="space-y-3">
                  {safeGuides.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      No hay guías registradas
                    </p>
                  ) : (
                    safeGuides.slice(0, 5).map((guide) => (
                      <div
                        key={guide.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                guide.is_published
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {guide.is_published ? 'PUBLICADA' : 'BORRADOR'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {guide.duration_seconds}s
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate mt-1">
                            {guide.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{guide.summary}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Policía / Admin / Operador Izquierda: Delitos Recientes (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="bg-slate-900/90 border-slate-800/90">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-sky-400" />
                    <CardTitle>Bandeja de Delitos Recientes (MS-02)</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('crime_reports')}
                    className="text-xs"
                  >
                    Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </CardHeader>

                <div className="space-y-2.5">
                  {isLoading ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      Cargando denuncias anónimas...
                    </div>
                  ) : safeCrimeReports.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No hay denuncias registradas en la comisaría.
                    </div>
                  ) : (
                    safeCrimeReports.map((report) => {
                      const prioStyle = getPriorityStyles(report.priority);
                      const statusStyle = getStatusStyles(report.status);

                      return (
                        <div
                          key={report.id}
                          onClick={() => openCrimeReportModal(report.id)}
                          className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.005]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-3 h-12 rounded-full ${
                                report.priority === 'urgente'
                                  ? 'bg-red-500'
                                  : report.priority === 'alta'
                                  ? 'bg-amber-500'
                                  : 'bg-sky-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-sky-400 tracking-wider">
                                  {report.public_code}
                                </span>
                                <Badge
                                  variant={report.priority === 'urgente' ? 'urgent' : 'default'}
                                >
                                  {report.category_name}
                                </Badge>
                                {report.is_emergency && (
                                  <Badge variant="urgent" pulse>
                                    SOS
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 font-medium truncate mt-1">
                                {report.description}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {report.address_reference || 'La Tinguiña, Ica'} •{' '}
                                {formatTimeAgo(report.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${statusStyle.bg}`}
                            >
                              {statusStyle.label}
                            </span>
                            <Button variant="ghost" size="icon" aria-label="Ver detalle">
                              <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Policía / Admin / Operador Derecha: Reportes Vecinales & Serenazgo (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="bg-slate-900/90 border-slate-800/90">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <CardTitle>Reportes Urbanos & Serenazgo (MS-03)</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('community_map')}
                    className="text-xs"
                  >
                    Ver Mapa <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </CardHeader>

                <div className="space-y-3">
                  {safeCommunityReports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      Sin reportes vecinales activos
                    </p>
                  ) : (
                    safeCommunityReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => openCommunityReportModal(report.public_code)}
                        className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800/80 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-purple-400">
                            {report.public_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatTimeAgo(report.created_at)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white mt-1">
                          {report.category_name}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {report.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                          <span>{report.address_reference || 'Sector Tinguiña'}</span>
                          <span className="text-purple-400 font-bold">
                            {report.shares_count} difusión(es)
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Tarjeta de dotación para Admin y Comisario */}
              {['admin', 'comisario'].includes(role) && (
                <Card className="bg-slate-900/80 border-slate-800/90 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white font-mono uppercase">
                        Estado de Guardia y Dotación
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">
                      {activeOfficersCount} Activos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Administradores</p>
                      <p className="text-base font-bold text-white mt-0.5">
                        {safeOfficers.filter((o) => o.role === 'admin').length}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <p className="text-[10px] text-slate-400 uppercase font-mono">Operadores</p>
                      <p className="text-base font-bold text-white mt-0.5">
                        {safeOfficers.filter((o) => o.role === 'operador').length}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

