import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  BookOpen,
  Users,
  Radio,
} from 'lucide-react';
import { useUiStore, ActiveTab } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useWebSocketStore } from '../../stores/websocketStore';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();
  const { officer } = useAuthStore();
  const { unreadEmergencyCount } = useWebSocketStore();

  const navItems: {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: number;
    roles?: string[];
  }[] = [
    {
      id: 'dashboard',
      label: 'Centro de Mando',
      description: 'Métricas y radar en vivo',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'crime_reports',
      label: 'Bandeja de Delitos',
      description: 'Denuncias anónimas y evidencias',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: unreadEmergencyCount > 0 ? unreadEmergencyCount : undefined,
      roles: ['admin', 'comisario', 'operador'],
    },
    {
      id: 'community_map',
      label: 'Mapa Vecinal & Serenazgo',
      description: 'Incidentes cívicos y derivación',
      icon: <MapPin className="w-5 h-5" />,
      roles: ['admin', 'comisario', 'operador', 'moderador'],
    },
    {
      id: 'guides',
      label: 'Guías & Trámites TikTok',
      description: 'Biblioteca cívica y multimedia',
      icon: <BookOpen className="w-5 h-5" />,
      roles: ['admin', 'comisario', 'moderador'],
    },
    {
      id: 'officers',
      label: 'Personal Policial',
      description: 'Oficiales y roles RBAC',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin', 'comisario'],
    },
  ];

  return (
    <aside className="w-full lg:w-64 lg:min-w-[16rem] lg:max-w-[16rem] shrink-0 flex-shrink-0 h-full glass-panel border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Módulos Operativos
        </div>

        {navItems.map((item) => {
          if (item.roles && officer && !item.roles.includes(officer.role)) {
            return null;
          }

          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                isActive
                  ? 'bg-sky-600/15 text-white border border-sky-500/40 shadow-lg shadow-sky-600/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">{item.label}</p>
                  <p className="text-[11px] text-slate-500 hidden lg:block">{item.description}</p>
                </div>
              </div>

              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white radar-emergency">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sector Quick Reference & Dispatch Hotline */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 px-2 space-y-2.5 hidden lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Radio className="w-3.5 h-3.5 text-sky-400" />
          <span>Frecuencia Radial PNP</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
          <p>
            <span className="text-slate-500">Central 105:</span> Tinguiña Directo
          </p>
          <p>
            <span className="text-slate-500">Jurisdicción:</span> Sector Ica Norte
          </p>
          <p>
            <span className="text-slate-500">Cuadrante:</span> Sectores 1 al 4
          </p>
        </div>
      </div>
    </aside>
  );
};
