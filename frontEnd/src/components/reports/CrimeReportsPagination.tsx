import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface CrimeReportsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const CrimeReportsPagination: React.FC<CrimeReportsPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startItem = totalItems > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 bg-slate-950/60">
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 font-mono text-xs cursor-pointer"
        >
          <option value={5}>5 por pág.</option>
          <option value={10}>10 por pág.</option>
          <option value={20}>20 por pág.</option>
          <option value={50}>50 por pág.</option>
        </select>
        <span className="text-slate-500 font-mono text-[11px]">
          {totalItems > 0 ? `${startItem} - ${endItem} de ${totalItems}` : '0 de 0'}
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
          <span className="font-bold text-sky-400">{safeCurrentPage}</span>
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
  );
};
