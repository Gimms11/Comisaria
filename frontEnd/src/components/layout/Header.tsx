import React, { useState } from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  LogOut,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWebSocketStore } from '../../stores/websocketStore';
import { useUiStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatTimeAgo } from '../../lib/utils';

export const Header: React.FC = () => {
  const { officer, logout } = useAuthStore();
  const { status, soundEnabled, toggleSound, alerts, unreadEmergencyCount, markAllAsRead } =
    useWebSocketStore();
  const { openCrimeReportModal } = useUiStore();
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'urgent';
      case 'comisario':
        return 'warning';
      case 'operador':
        return 'info';
      case 'moderador':
      default:
        return 'default';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Badge & Live Hub Indicator */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight font-heading">
                COMISARÍA PNP LA TINGUIÑA
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/50">
                División Policial Ica
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Centro de Comando & Despacho Digital</p>
          </div>
        </div>

        {/* Right: Tactical Status, Siren Audio, Notifications & Officer Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* WebSocket Online Status Beacon */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <Radio
              className={`w-3.5 h-3.5 ${
                status === 'CONNECTED'
                  ? 'text-emerald-400 live-beacon'
                  : status === 'CONNECTING'
                  ? 'text-amber-400 animate-pulse'
                  : 'text-red-400'
              }`}
            />
            <span
              className={`font-semibold font-mono text-[11px] hidden md:inline ${
                status === 'CONNECTED'
                  ? 'text-emerald-400'
                  : status === 'CONNECTING'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {status === 'CONNECTED'
                ? 'RADAR ONLINE'
                : status === 'CONNECTING'
                ? 'ENLAZANDO...'
                : 'OFFLINE'}
            </span>
          </div>

          {/* Tactical Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSound}
            title={soundEnabled ? 'Silenciar sirenas tácticas' : 'Activar sirenas tácticas'}
            className="text-xs px-2.5 sm:px-3 bg-slate-900/90 border-slate-800"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline text-slate-300">Sirenas ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="hidden lg:inline text-slate-400">Silenciado</span>
              </>
            )}
          </Button>

          {/* Emergency Alert Notification Bell */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setShowAlertMenu(!showAlertMenu);
                if (unreadEmergencyCount > 0) markAllAsRead();
              }}
              className="relative bg-slate-900/90 border-slate-800"
              aria-label="Alertas en tiempo real"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {unreadEmergencyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-950 radar-emergency">
                  {unreadEmergencyCount}
                </span>
              )}
            </Button>

            {/* Notification Dropdown */}
            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">Últimas Alertas Despachadas</h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {alerts.length} registros
                  </span>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      Sin alertas recientes en el canal
                    </p>
                  ) : (
                    alerts.slice(0, 8).map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => {
                          if (alert.extra_data?.report_id) {
                            openCrimeReportModal(alert.extra_data.report_id);
                            setShowAlertMenu(false);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={
                              alert.priority === 'urgente'
                                ? 'urgent'
                                : alert.priority === 'alta'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {alert.public_code}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-200 mt-1.5 line-clamp-1">
                          {alert.category_name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Officer Profile & Logout */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-slate-200 font-heading">
                  {officer?.full_name || 'Oficial de Guardia'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Badge variant={getRoleBadgeVariant(officer?.role)} className="text-[10px] py-0 px-1.5">
                  {officer?.role?.toUpperCase() || 'OPERADOR'}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Cerrar sesión de guardia"
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
