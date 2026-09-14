import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, X, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketStore } from '../../stores/websocketStore';
import { useUiStore } from '../../stores/uiStore';
import { Button } from './Button';
import { Badge } from './Badge';
import { formatTimeAgo } from '../../lib/utils';

export const LiveAlertToast: React.FC = () => {
  const { activeNotification, dismissNotification } = useWebSocketStore();
  const { openCrimeReportModal, openCommunityReportModal, setActiveTab } = useUiStore();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!activeNotification) return;

    setProgress(100);
    const stepMs = 100;
    const totalMs = 7000;
    const decrement = (stepMs / totalMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return Math.max(0, prev - decrement);
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [activeNotification]);

  if (!activeNotification) return null;

  const isCrime = activeNotification.event_type === 'NEW_CRIME_REPORT';
  const isEmergency =
    activeNotification.priority === 'urgente' ||
    activeNotification.priority === 'alta';

  const handleInspect = () => {
    if (isCrime) {
      setActiveTab('crime_reports');
      navigate('/delitos');
      const targetId = activeNotification.extra_data?.report_id || activeNotification.public_code;
      if (targetId) {
        openCrimeReportModal(targetId);
      }
    } else {
      setActiveTab('community_map');
      navigate('/mapa');
      const targetCode = activeNotification.public_code || activeNotification.extra_data?.report_id;
      if (targetCode) {
        openCommunityReportModal(targetCode);
      }
    }
    dismissNotification();
  };

  return (
    <div
      role="alert"
      data-testid="live-alert-toast"
      className="fixed top-4 right-4 z-[9998] w-[calc(100vw-2rem)] sm:w-96 max-w-md rounded-2xl bg-slate-950/95 border-2 border-red-500/80 shadow-2xl shadow-red-950/90 backdrop-blur-xl p-3.5 sm:p-4 text-white animate-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-300 transition-all overflow-hidden"
    >
      {/* Header with Beacon & Dismiss */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-red-600 text-white radar-emergency shrink-0">
            {isEmergency ? (
              <Flame className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="font-mono font-black text-xs tracking-wider text-red-400 uppercase truncate">
            {isEmergency ? '¡ALERTA SOS POLICIAL!' : 'NUEVA DENUNCIA REGISTRADA'}
          </span>
        </div>
        <button
          onClick={dismissNotification}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Details */}
      <div className="space-y-1.5 my-1 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-extrabold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 rounded">
            {activeNotification.public_code}
          </span>
          <Badge
            variant={isEmergency ? 'urgent' : 'warning'}
            className="text-[10px] uppercase font-bold"
          >
            Prioridad {activeNotification.priority}
          </Badge>
        </div>
        <p className="text-sm font-semibold text-slate-100 line-clamp-1">
          {activeNotification.category_name}
        </p>
        <p className="text-xs text-slate-400 font-mono">
          {formatTimeAgo(activeNotification.timestamp)} • Centro de Control Activo
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-slate-800/60">
        <Button
          variant="outline"
          size="sm"
          onClick={dismissNotification}
          className="text-xs py-1 px-2.5 border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          Descartar
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleInspect}
          className="text-xs py-1 px-3 font-bold gap-1 shadow-lg shadow-red-600/30 whitespace-nowrap"
        >
          Intervenir <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
        <div
          className="h-full bg-red-500 transition-all ease-linear duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
