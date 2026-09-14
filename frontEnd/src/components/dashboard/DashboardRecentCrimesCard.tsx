import React from 'react';
import { ShieldAlert, Eye, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CrimeReportListItem } from '../../types';
import { formatTimeAgo, getStatusStyles } from '../../lib/utils';

interface DashboardRecentCrimesCardProps {
  crimeReports: CrimeReportListItem[];
  isLoading: boolean;
  onSelectReport: (id: string) => void;
  onViewAll: () => void;
}

export const DashboardRecentCrimesCard: React.FC<DashboardRecentCrimesCardProps> = ({
  crimeReports,
  isLoading,
  onSelectReport,
  onViewAll,
}) => {
  return (
    <Card className="bg-slate-900/90 border-slate-800/90 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl shadow-xl w-full min-h-[340px]">
      <div className="flex flex-col">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono truncate">
              Bandeja de Delitos Recientes
            </h3>
          </div>
          <span className="text-[11px] text-sky-400 font-mono font-semibold">
            {crimeReports.length} casos totales
          </span>
        </div>

        <div className="space-y-3 my-2">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">
              Cargando denuncias anónimas...
            </div>
          ) : crimeReports.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No hay denuncias registradas en la comisaría.
            </div>
          ) : (
            crimeReports.slice(0, 4).map((report) => {
              const statusStyle = getStatusStyles(report.status);

              return (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.002]"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-2.5 h-10 rounded-full shrink-0 mt-0.5 ${
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
                          <Badge
                            variant="urgent"
                            pulse
                            className="text-[10px] py-0 px-1.5 whitespace-nowrap shrink-0"
                          >
                            SOS
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-auto sm:ml-0">
                          {formatTimeAgo(report.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {report.description}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1 break-words">
                        {report.address_reference || 'La Tinguiña, Ica'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t border-slate-800/60 sm:border-0">
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${statusStyle.bg}`}
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
          onClick={onViewAll}
          className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-sky-300"
        >
          Ver Bandeja Completa de Delitos ({crimeReports.length} casos){' '}
          <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </Card>
  );
};
