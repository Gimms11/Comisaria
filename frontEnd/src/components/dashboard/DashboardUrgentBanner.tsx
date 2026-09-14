import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { LiveAlertEvent } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

export interface UrgentBannerData {
  id?: string;
  public_code: string;
  category_name: string;
  timestamp?: string;
  created_at?: string;
  extra_data?: Record<string, any>;
}

interface DashboardUrgentBannerProps {
  alert: UrgentBannerData;
  onIntervene: () => void;
}

export const DashboardUrgentBanner: React.FC<DashboardUrgentBannerProps> = ({
  alert,
  onIntervene,
}) => {
  return (
    <div className="p-2.5 px-3.5 rounded-xl bg-gradient-to-r from-red-950/90 via-red-900/70 to-slate-900 border border-red-500/50 shadow-lg flex items-center justify-between gap-3 animate-in fade-in shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-red-600 text-white radar-emergency shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 font-mono whitespace-nowrap">
            ALERTA SOS
          </span>
          <span className="text-xs text-white font-semibold break-words">
            {alert.public_code} • {alert.category_name}
          </span>
          <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
            ({formatTimeAgo(alert.timestamp || alert.created_at || new Date().toISOString())})
          </span>
        </div>
      </div>

      <Button
        variant="danger"
        size="sm"
        onClick={onIntervene}
        className="text-xs py-1 px-2.5 whitespace-nowrap shrink-0"
      >
        Intervenir <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
};
