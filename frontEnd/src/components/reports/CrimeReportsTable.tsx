import React from 'react';
import { Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CrimeReportListItem, ReportPriority, ReportStatus } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface CrimeReportsTableProps {
  reports: CrimeReportListItem[];
  isLoading: boolean;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onSelectReport: (id: string) => void;
  getPriorityStyles: (prio: ReportPriority) => { badge: string };
  getStatusStyles: (status: ReportStatus) => { bg: string; dot: string; label: string };
}

export const CrimeReportsTable: React.FC<CrimeReportsTableProps> = ({
  reports,
  isLoading,
  sortField,
  sortOrder,
  onSort,
  onSelectReport,
  getPriorityStyles,
  getStatusStyles,
}) => {
  const renderSortHeader = (field: string, label: string) => {
    const isCurrent = sortField === field;
    return (
      <th
        onClick={() => onSort(field)}
        className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-slate-500 group-hover:text-slate-300">
            {isCurrent ? (
              sortOrder === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40 group-hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider font-mono">
          <tr>
            {renderSortHeader('public_code', 'Código')}
            {renderSortHeader('category_name', 'Delito / Categoría')}
            {renderSortHeader('description', 'Descripción del Hecho')}
            {renderSortHeader('address_reference', 'Ubicación')}
            {renderSortHeader('priority', 'Prioridad')}
            {renderSortHeader('status', 'Estado')}
            {renderSortHeader('created_at', 'Fecha')}
            <th className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-500">
                Cargando expedientes de denuncias...
              </td>
            </tr>
          ) : reports.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-500">
                No se encontraron denuncias con los filtros seleccionados.
              </td>
            </tr>
          ) : (
            reports.map((r) => {
              const prioStyle = getPriorityStyles(r.priority);
              const statusStyle = getStatusStyles(r.status);

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectReport(r.id)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                    {r.public_code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span>{r.category_name}</span>
                      {r.is_emergency && (
                        <Badge variant="urgent" pulse className="text-[10px] py-0 whitespace-nowrap shrink-0">
                          SOS
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                    {r.description}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs max-w-[200px] truncate">
                    {r.address_reference || 'La Tinguiña, Ica'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap shrink-0 inline-flex items-center ${prioStyle.badge}`}
                    >
                      {r.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${statusStyle.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                    {formatTimeAgo(r.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Eye className="w-3.5 h-3.5 text-slate-300" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
