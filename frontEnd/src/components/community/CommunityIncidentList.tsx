import React from 'react';
import { Share2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { CommunityReportListItem } from '../../types';
import { formatTimeAgo, getPriorityStyles, getStatusStyles } from '../../lib/utils';

interface CommunityIncidentListProps {
  reports: CommunityReportListItem[];
  isLoading: boolean;
  onSelectReport: (code: string) => void;
}

export const CommunityIncidentList: React.FC<CommunityIncidentListProps> = ({
  reports,
  isLoading,
  onSelectReport,
}) => {
  return (
    <Card className="bg-slate-900/90 border-slate-800 h-[420px] lg:h-[600px] flex flex-col">
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Incidentes Vecinales</span>
          <span className="text-xs font-mono font-normal text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
            {reports.length} filtrados
          </span>
        </CardTitle>
      </CardHeader>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <p className="text-center py-10 text-slate-500 text-xs">Cargando mapa...</p>
        ) : reports.length === 0 ? (
          <p className="text-center py-10 text-slate-500 text-xs">Sin reportes con los filtros seleccionados</p>
        ) : (
          reports.map((r) => {
            const statusStyle = getStatusStyles(r.status);
            const prioStyle = getPriorityStyles(r.priority);
            return (
              <div
                key={r.id}
                onClick={() => onSelectReport(r.public_code)}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors space-y-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-400 whitespace-nowrap">
                    {r.public_code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                    {formatTimeAgo(r.created_at)}
                  </span>
                </div>

                <p className="text-xs font-semibold text-white">{r.category_name}</p>
                <p className="text-xs text-slate-300 line-clamp-2">{r.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${statusStyle.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />
                    {statusStyle.label}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase whitespace-nowrap shrink-0 ${prioStyle.badge}`}
                  >
                    {r.priority}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-mono whitespace-nowrap shrink-0">
                    <Share2 className="w-3 h-3 text-purple-400" /> {r.shares_count}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
