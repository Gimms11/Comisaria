import React from 'react';
import { ShieldAlert, MapPin, BookOpen, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { OfficerRole } from '../../types';

interface DashboardRoleHeaderProps {
  role: OfficerRole;
  onNavigate: (tab: 'crime_reports' | 'community_map' | 'guides' | 'officers') => void;
}

export const DashboardRoleHeader: React.FC<DashboardRoleHeaderProps> = ({
  role,
  onNavigate,
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 shrink-0">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-md border font-mono font-bold text-[10px] tracking-wider uppercase shrink-0 ${
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
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
            {role === 'admin' && 'Centro de Mando Integral y Auditoría'}
            {role === 'comisario' && 'Puesto de Comando y Dirección Operativa'}
            {role === 'operador' && 'Consola Táctica de Guardia y Despacho'}
            {role === 'moderador' && 'Centro de Participación Vecinal y Contenido Cívico'}
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-3xl">
          {role === 'admin' && 'Supervisión de seguridad, dotación policial y gestión operativa integral.'}
          {role === 'comisario' && 'Monitoreo estratégico, directivas de despacho y coordinación distrital.'}
          {role === 'operador' && 'Atención de emergencias, radar de denuncias y mesa de partes.'}
          {role === 'moderador' && 'Gestión de reportes a Serenazgo y edición de guías ciudadanas.'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 flex-wrap pt-2.5 lg:pt-0 border-t border-slate-800/60 lg:border-0">
        {['admin', 'comisario', 'operador'].includes(role) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('crime_reports')}
            className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Delitos
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('community_map')}
          className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Mapa Vecinal
        </Button>
        {['admin', 'comisario', 'moderador'].includes(role) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('guides')}
            className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Guías Cívicas
          </Button>
        )}
        {['admin', 'comisario'].includes(role) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('officers')}
            className="text-xs py-1 px-2.5 gap-1 border-slate-700 bg-slate-950/60 whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Dotación PNP
          </Button>
        )}
      </div>
    </div>
  );
};
