import React from 'react';
import { Search, SlidersHorizontal, Flame } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Category } from '../../types';

interface StatusCounts {
  todos: number;
  pendiente: number;
  en_revision: number;
  en_atencion: number;
  derivado: number;
  resuelto: number;
  archivado: number;
  rechazado: number;
  sos: number;
}

interface CrimeReportsFilterBarProps {
  statusFilter: string;
  isEmergencyOnly: boolean;
  searchQuery: string;
  priorityFilter: string;
  categoryIdFilter: string;
  dateRangeFilter: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  categories: Category[];
  statusCounts: StatusCounts;
  totalFiltered: number;
  totalAll: number;
  onStatusChange: (status: string) => void;
  onEmergencyToggle: () => void;
  onSearchChange: (query: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (catId: string) => void;
  onDateRangeChange: (range: string) => void;
}

export const CrimeReportsFilterBar: React.FC<CrimeReportsFilterBarProps> = ({
  statusFilter,
  isEmergencyOnly,
  searchQuery,
  priorityFilter,
  categoryIdFilter,
  dateRangeFilter,
  sortField,
  sortOrder,
  categories,
  statusCounts,
  totalFiltered,
  totalAll,
  onStatusChange,
  onEmergencyToggle,
  onSearchChange,
  onPriorityChange,
  onCategoryChange,
  onDateRangeChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Quick Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => onStatusChange('')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            !statusFilter && !isEmergencyOnly
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.todos}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('pendiente')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'pendiente' && !isEmergencyOnly
              ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-yellow-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          <span>Pendientes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.pendiente}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('en_revision')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'en_revision' && !isEmergencyOnly
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-blue-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          <span>En Revisión</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.en_revision}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('en_atencion')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'en_atencion' && !isEmergencyOnly
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
          <span>En Atención</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.en_atencion}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('derivado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'derivado' && !isEmergencyOnly
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-purple-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
          <span>Derivados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.derivado}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('resuelto')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'resuelto' && !isEmergencyOnly
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>Resueltos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.resuelto}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('archivado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'archivado' && !isEmergencyOnly
              ? 'bg-slate-600 text-white shadow-md shadow-slate-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          <span>Archivados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.archivado}
          </span>
        </button>

        <button
          onClick={() => onStatusChange('rechazado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'rechazado' && !isEmergencyOnly
              ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
              : 'bg-slate-900 text-slate-400 hover:text-rose-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>Rechazados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.rechazado}
          </span>
        </button>

        <button
          onClick={onEmergencyToggle}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            isEmergencyOnly
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
              : 'bg-slate-900 text-rose-400 hover:bg-rose-950/30 border border-rose-500/30'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
          <span>Solo SOS ({statusCounts.sos})</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <Card className="bg-slate-900/80 border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Buscar por código (LT-2026-...) o texto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <Select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
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

          <Select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            options={[
              { value: '', label: 'Todas las Prioridades' },
              { value: 'urgente', label: 'Urgente' },
              { value: 'alta', label: 'Alta' },
              { value: 'media', label: 'Media' },
              { value: 'baja', label: 'Baja' },
            ]}
          />

          <Select
            value={categoryIdFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={[
              { value: '', label: 'Todas las Categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            value={dateRangeFilter}
            onChange={(e) => onDateRangeChange(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las Fechas' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Últimos 7 días' },
              { value: 'month', label: 'Este mes' },
            ]}
          />
        </div>

        {/* Results Info and Active Sort Indicator */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
          <div className="whitespace-nowrap">
            Filtrados <span className="text-white font-bold">{totalFiltered}</span> de{' '}
            <span className="text-slate-300 font-bold">{totalAll}</span> denuncias
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              Ordenado por:{' '}
              <span className="text-sky-300 font-semibold uppercase">
                {sortField === 'priority'
                  ? 'Prioridad'
                  : sortField === 'created_at'
                  ? 'Fecha'
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
