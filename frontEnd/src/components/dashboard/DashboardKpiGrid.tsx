import React from 'react';
import {
  AlertTriangle,
  Clock,
  FileText,
  Users,
  MapPin,
  Share2,
  Video,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { OfficerRole } from '../../types';

interface DashboardKpiGridProps {
  role: OfficerRole;
  urgentCount: number;
  inProgressCount: number;
  pendingCount: number;
  activeOfficersCount: number;
  communityTotal: number;
  communityPending: number;
  publishedGuidesCount: number;
  totalGuidesCount: number;
  totalShares: number;
  onNavigate: (tab: 'crime_reports' | 'community_map' | 'guides' | 'officers') => void;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({
  role,
  urgentCount,
  inProgressCount,
  pendingCount,
  activeOfficersCount,
  communityTotal,
  communityPending,
  publishedGuidesCount,
  totalGuidesCount,
  totalShares,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
      {role === 'moderador' ? (
        <>
          <Card
            onClick={() => onNavigate('community_map')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-purple-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                INCIDENTES VECINALES
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {communityTotal}
                </span>
                <p className="text-[11px] text-purple-400 font-medium mt-0.5">
                  Reportes registrados
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => onNavigate('community_map')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-amber-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                PENDIENTES SERENAZGO
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {communityPending}
                </span>
                <p className="text-[11px] text-amber-400 font-medium mt-0.5">Por canalizar</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => onNavigate('guides')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-emerald-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                GUÍAS PUBLICADAS
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {publishedGuidesCount}
                </span>
                <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  De {totalGuidesCount} guías
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => onNavigate('community_map')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-sky-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                DIFUSIÓN COMUNITARIA
              </span>
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:scale-110 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">{totalShares}</span>
                <p className="text-[11px] text-sky-400 font-medium mt-0.5">
                  Vecinos involucrados
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card
            onClick={() => onNavigate('crime_reports')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-red-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                URGENCIAS ACTIVAS
              </span>
              <div className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {urgentCount}
                </span>
                <p className="text-[11px] text-red-400 font-medium mt-0.5">
                  Prioridad Inmediata / SOS
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => onNavigate('crime_reports')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-sky-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                EN ATENCIÓN / TURNO
              </span>
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {inProgressCount}
                </span>
                <p className="text-[11px] text-sky-400 font-medium mt-0.5">
                  En proceso operativo
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => onNavigate('crime_reports')}
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-amber-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                PENDIENTES DE REVISIÓN
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {pendingCount}
                </span>
                <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                  Mesa de partes / guardia
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() =>
              onNavigate(['admin', 'comisario'].includes(role) ? 'officers' : 'community_map')
            }
            className="glass-card-hover bg-slate-900/80 border-slate-800 p-3.5 sm:p-4 cursor-pointer hover:border-purple-500/60 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
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
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  {['admin', 'comisario'].includes(role) ? activeOfficersCount : communityTotal}
                </span>
                <p className="text-[11px] text-purple-400 font-medium mt-0.5">
                  {['admin', 'comisario'].includes(role)
                    ? 'Efectivos activos registrados'
                    : 'Incidentes Serenazgo'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
