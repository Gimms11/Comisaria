import React from 'react';
import { MapPin, Eye, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CommunityReportListItem } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface DashboardRecentCommunityCardProps {
  communityReports: CommunityReportListItem[];
  isLoading: boolean;
  onSelectReport: (code: string) => void;
  onViewAll: () => void;
  isModeratorView?: boolean;
}

export const DashboardRecentCommunityCard: React.FC<DashboardRecentCommunityCardProps> = ({
  communityReports,
  isLoading,
  onSelectReport,
  onViewAll,
  isModeratorView = false,
}) => {
  return (
    <Card className="bg-slate-900/90 border-slate-800/90 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl shadow-xl w-full min-h-[340px]">
      <div className="flex flex-col">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono truncate">
              {isModeratorView ? 'Bandeja Vecinal & Serenazgo' : 'Reportes Urbanos y Serenazgo'}
            </h3>
          </div>
          <span className="text-[11px] text-purple-400 font-mono font-semibold">
            {communityReports.length} {isModeratorView ? 'reportes' : 'registros'}
          </span>
        </div>

        <div className="space-y-3 my-2">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">
              Cargando reportes vecinales...
            </div>
          ) : communityReports.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              Sin reportes vecinales activos
            </p>
          ) : isModeratorView ? (
            communityReports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.public_code)}
                className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-purple-400 whitespace-nowrap">
                      {report.public_code}
                    </span>
                    <Badge variant="default" className="text-[10px] py-0 px-1.5 whitespace-nowrap shrink-0">
                      {report.category_name}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {formatTimeAgo(report.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium line-clamp-2 mt-1 leading-relaxed">
                    {report.description}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1 break-words">
                    {report.address_reference || 'Sector La Tinguiña'} •{' '}
                    <span className="text-purple-400 font-semibold">
                      {report.shares_count} difusión(es)
                    </span>
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 self-end sm:self-center">
                  <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                </Button>
              </div>
            ))
          ) : (
            communityReports.slice(0, 3).map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.public_code)}
                className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-purple-400 whitespace-nowrap">
                    {report.public_code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {formatTimeAgo(report.created_at)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white leading-snug">
                  {report.category_name}
                </p>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {report.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/70 text-[11px] text-slate-400 font-mono">
                  <span className="break-words">
                    {report.address_reference || 'Sector Tinguiña'}
                  </span>
                  <span className="text-purple-400 font-semibold whitespace-nowrap shrink-0 ml-2">
                    {report.shares_count} difusión(es)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-2.5 mt-2 border-t border-slate-800/80">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewAll}
          className="w-full text-xs py-1.5 justify-center border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-purple-300"
        >
          {isModeratorView
            ? `Ver Mapa Comunitario Completo (${communityReports.length} reportes)`
            : `Ver en Mapa Vecinal (${communityReports.length} reportes)`}{' '}
          <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </Card>
  );
};
