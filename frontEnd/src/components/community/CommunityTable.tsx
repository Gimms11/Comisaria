import React from 'react';
import {
  MapPin,
  Share2,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CommunityReportListItem } from '../../types';
import { formatTimeAgo, getPriorityStyles, getStatusStyles } from '../../lib/utils';

export type CommunitySortField =
  | 'public_code'
  | 'category_name'
  | 'description'
  | 'address_reference'
  | 'priority'
  | 'status'
  | 'shares_count'
  | 'created_at';

interface CommunityTableProps {
  reports: CommunityReportListItem[];
  isLoading: boolean;
  sortField: CommunitySortField;
  sortOrder: 'asc' | 'desc';
  onSort: (field: CommunitySortField) => void;
  onSelectReport: (code: string) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const CommunityTable: React.FC<CommunityTableProps> = ({
  reports,
  isLoading,
  sortField,
  sortOrder,
  onSort,
  onSelectReport,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const renderSortHeader = (field: CommunitySortField, label: string, className = '') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => onSort(field)}
        className={`py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-white group ${
          isActive ? 'text-purple-400 bg-slate-900/60 font-bold' : 'text-slate-400'
        } ${className}`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{label}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </div>
      </th>
    );
  };

  return (
    <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
      {/* Mobile View: Clean Card List (< md) */}
      <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            Cargando reportes comunitarios...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No se encontraron reportes con los filtros seleccionados.
          </div>
        ) : (
          reports.map((r) => {
            const prioStyle = getPriorityStyles(r.priority);
            const statusStyle = getStatusStyles(r.status);

            return (
              <div
                key={r.id}
                onClick={() => onSelectReport(r.public_code)}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 cursor-pointer hover:border-purple-500/50 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-purple-400">
                    {r.public_code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatTimeAgo(r.created_at)}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">{r.category_name}</p>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{r.description}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
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
                  <span className="text-slate-400 flex items-center gap-1 font-mono text-xs">
                    <Share2 className="w-3 h-3 text-purple-400" /> {r.shares_count}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap shrink-0 inline-flex items-center ${prioStyle.badge}`}
                  >
                    {r.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop / Tablet View: Full Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider font-mono">
            <tr>
              {renderSortHeader('public_code', 'Código')}
              {renderSortHeader('category_name', 'Categoría')}
              {renderSortHeader('description', 'Incidencia / Hecho')}
              {renderSortHeader('address_reference', 'Ubicación')}
              {renderSortHeader('priority', 'Prioridad')}
              {renderSortHeader('status', 'Estado')}
              {renderSortHeader('shares_count', 'Difusiones')}
              {renderSortHeader('created_at', 'Fecha')}
              <th className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  Cargando reportes comunitarios...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No se encontraron reportes con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const prioStyle = getPriorityStyles(r.priority);
                const statusStyle = getStatusStyles(r.status);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectReport(r.public_code)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400 whitespace-nowrap">
                      {r.public_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {r.category_name}
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
                    <td className="py-3.5 px-4 text-xs font-mono text-purple-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5" />
                        {r.shares_count}
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

      {/* Table Pagination Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 font-mono text-xs cursor-pointer"
          >
            <option value={5}>5 por pág.</option>
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
            <option value={50}>50 por pág.</option>
          </select>
          <span className="text-slate-500 font-mono text-[11px]">
            {totalItems > 0
              ? `${(safeCurrentPage - 1) * pageSize + 1} - ${Math.min(safeCurrentPage * pageSize, totalItems)} de ${totalItems}`
              : '0 de 0'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage <= 1}
            className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
            title="Primera página"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage <= 1}
            className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
            title="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <div className="flex items-center gap-1 px-2 font-mono text-xs text-slate-300">
            <span>Pág.</span>
            <span className="font-bold text-purple-400">{safeCurrentPage}</span>
            <span>/</span>
            <span className="font-bold text-white">{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
            title="Página siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
            title="Última página"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
