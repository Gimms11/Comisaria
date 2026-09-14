import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Category } from '../../types';

interface CommunityFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categories: Category[];
  categoryIdFilter: string;
  onCategoryFilterChange: (val: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (val: string) => void;
  dateRangeFilter: string;
  onDateRangeFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  statusCounts: Record<string, number>;
  totalFiltered: number;
  totalCount: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export const CommunityFilterBar: React.FC<CommunityFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  categoryIdFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  totalFiltered,
  totalCount,
  sortField,
  sortOrder,
}) => {
  return (
    <div className="space-y-4">
      {/* Quick Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => onStatusFilterChange('')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === ''
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>Todos los Reportes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.todos || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('pendiente')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'pendiente'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          <span>Pendientes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.pendiente || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('en_revision')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'en_revision'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-blue-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          <span>En Revisión</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.en_revision || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('derivado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'derivado'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-purple-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
          <span>Derivados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.derivado || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('en_atencion')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'en_atencion'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
          <span>En Atención</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.en_atencion || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('resuelto')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'resuelto'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>Resueltos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.resuelto || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('archivado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'archivado'
              ? 'bg-slate-600 text-white shadow-md shadow-slate-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          <span>Archivados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.archivado || 0}
          </span>
        </button>

        <button
          onClick={() => onStatusFilterChange('rechazado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'rechazado'
              ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
              : 'bg-slate-900 text-slate-400 hover:text-rose-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Rechazados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.rechazado || 0}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/80 border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Buscar código (LT-2026-...), calle o detalle..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <Select
            value={categoryIdFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            options={[
              { value: '', label: 'Todas las Categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            options={[
              { value: '', label: 'Todas las Prioridades' },
              { value: 'urgente', label: 'Urgente' },
              { value: 'alta', label: 'Alta' },
              { value: 'media', label: 'Media' },
              { value: 'baja', label: 'Baja' },
            ]}
          />

          <Select
            value={dateRangeFilter}
            onChange={(e) => onDateRangeFilterChange(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las Fechas' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Últimos 7 días' },
              { value: 'month', label: 'Este mes' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            options={[
              { value: '', label: 'Todos los Estados' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'en_revision', label: 'En Revisión' },
              { value: 'en_atencion', label: 'En Atención' },
              { value: 'derivado', label: 'Derivado' },
              { value: 'resuelto', label: 'Resuelto' },
              { value: 'archivado', label: 'Archivado' },
              { value: 'rechazado', label: 'Rechazado' },
            ]}
          />
        </div>

        {/* Results Info and Active Sort Indicator */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
          <div className="whitespace-nowrap">
            Filtrados <span className="text-purple-400 font-bold">{totalFiltered}</span> de{' '}
            <span className="text-white font-bold">{totalCount}</span> incidentes vecinales
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              Ordenado por:{' '}
              <span className="text-purple-300 font-semibold uppercase">
                {sortField === 'priority'
                  ? 'Prioridad'
                  : sortField === 'created_at'
                  ? 'Fecha'
                  : sortField === 'shares_count'
                  ? 'Difusiones'
                  : sortField === 'status'
                  ? 'Estado'
                  : sortField === 'public_code'
                  ? 'Código'
                  : sortField === 'category_name'
                  ? 'Categoría'
                  : sortField}
              </span>{' '}
              ({sortOrder === 'asc' ? 'Ascendente' : 'Descendente'})
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
