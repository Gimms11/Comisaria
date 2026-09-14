import React from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CrimeReportListItem, ReportPriority, ReportStatus } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface CrimeReportsCardListProps {
  reports: CrimeReportListItem[];
  isLoading: boolean;
  onSelectReport: (id: string) => void;
  getPriorityStyles: (prio: ReportPriority) => { badge: string };
  getStatusStyles: (status: ReportStatus) => { bg: string; dot: string; label: string };
}

export const CrimeReportsCardList: React.FC<CrimeReportsCardListProps> = ({
  reports,
  isLoading,
  onSelectReport,
  getPriorityStyles,
  getStatusStyles,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500 text-xs font-mono">
        Cargando expedientes de denuncias...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-xs">
        No se encontraron denuncias con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
      {reports.map((r) => {
        const prioStyle = getPriorityStyles(r.priority);
        const statusStyle = getStatusStyles(r.status);

        return (
          <div
            key={r.id}
            onClick={() => onSelectReport(r.id)}
            className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 cursor-pointer hover:border-sky-500/50 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-sky-400">
                  {r.public_code}
                </span>
                {r.is_emergency && (
                  <Badge variant="urgent" pulse className="text-[10px] py-0 px-1.5 whitespace-nowrap">
                    SOS
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatTimeAgo(r.created_at)}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">{r.category_name}</p>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{r.description}</p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">{r.address_reference || 'La Tinguiña, Ica'}</span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
              <span
                className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${statusStyle.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />
                {statusStyle.label}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap shrink-0 inline-flex items-center ${prioStyle.badge}`}
              >
                {r.priority}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
