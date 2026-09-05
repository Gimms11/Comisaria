import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Eye,
  Clock,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Category,
  CrimeReportDetail,
  CrimeReportListItem,
} from '../../types';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useWebSocketStore } from '../../stores/websocketStore';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { EvidenceViewerModal } from '../ui/EvidenceViewerModal';
import { WorkflowActionPanel } from '../ui/WorkflowActionPanel';
import { formatDateTime, formatTimeAgo, getPriorityStyles, getStatusStyles } from '../../lib/utils';

type SortField =
  | 'public_code'
  | 'category_name'
  | 'description'
  | 'address_reference'
  | 'priority'
  | 'status'
  | 'created_at';

type SortOrder = 'asc' | 'desc';

const PRIORITY_WEIGHT: Record<string, number> = {
  urgente: 4,
  alta: 3,
  media: 2,
  baja: 1,
};

const STATUS_WEIGHT: Record<string, number> = {
  pendiente: 1,
  en_revision: 2,
  en_atencion: 3,
  derivado: 4,
  resuelto: 5,
  archivado: 6,
  rechazado: 7,
};

export const CrimeReportsView: React.FC = () => {
  const { selectedCrimeReportId, openCrimeReportModal, closeCrimeReportModal } = useUiStore();
  const { officer } = useAuthStore();
  const { latestAlert } = useWebSocketStore();

  const [reports, setReports] = useState<CrimeReportListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEmergencyOnly, setIsEmergencyOnly] = useState<boolean>(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  // Interactive Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected Detail State
  const [detail, setDetail] = useState<CrimeReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Evidence Lightbox State
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceInitialIndex, setEvidenceInitialIndex] = useState(0);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.listCrimeReports({ limit: 200 });
      setReports(res?.items || []);
    } catch (e) {
      console.warn('Error al listar denuncias:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.listCrimeCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al listar categorías:', e);
    }
  }, []);

  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchReports();
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [reportsRes, catsRes] = await Promise.all([
          api.listCrimeReports({ limit: 200 }),
          api.listCrimeCategories(),
        ]);
        if (isMounted) {
          setReports(reportsRes?.items || []);
          setCategories(catsRes || []);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('Error al cargar denuncias:', e);
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Recarga reactiva en tiempo real al registrarse nuevo delito o cambiar estado
  useEffect(() => {
    if (
      latestAlert &&
      (latestAlert.event_type === 'NEW_CRIME_REPORT' || latestAlert.event_type === 'STATUS_CHANGED')
    ) {
      fetchReports();
    }
  }, [latestAlert, fetchReports]);

  // Load modal detail
  useEffect(() => {
    if (selectedCrimeReportId) {
      let isMounted = true;
      setIsLoadingDetail(true);
      api
        .getCrimeReportDetail(selectedCrimeReportId)
        .then((data) => {
          if (isMounted) {
            setDetail(data);
            setIsLoadingDetail(false);
          }
        })
        .catch((err) => {
          console.error('Error al cargar detalle:', err);
          if (isMounted) setIsLoadingDetail(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setDetail(null);
    }
  }, [selectedCrimeReportId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'priority' || field === 'created_at' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryIdFilter('');
    setSearchQuery('');
    setIsEmergencyOnly(false);
    setDateRangeFilter('all');
    setSortField('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePriorityFilterChange = (val: string) => {
    setPriorityFilter(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryIdFilter(val);
    setCurrentPage(1);
  };

  const handleDateRangeFilterChange = (val: string) => {
    setDateRangeFilter(val);
    setCurrentPage(1);
  };

  const handleEmergencyToggle = () => {
    setIsEmergencyOnly((prev) => !prev);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(statusFilter) ||
    Boolean(priorityFilter) ||
    Boolean(categoryIdFilter) ||
    Boolean(searchQuery) ||
    isEmergencyOnly ||
    dateRangeFilter !== 'all';

  // In-memory Filter & Sort pipeline across ALL items
  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    // 1. Search Query across all fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.public_code.toLowerCase().includes(q) ||
          r.category_name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.address_reference && r.address_reference.toLowerCase().includes(q))
      );
    }

    // 2. Status filter
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    // 3. Priority filter
    if (priorityFilter) {
      result = result.filter((r) => r.priority === priorityFilter);
    }

    // 4. Category filter
    if (categoryIdFilter) {
      const selectedCat = categories.find((c) => c.id === categoryIdFilter);
      if (selectedCat) {
        result = result.filter((r) => r.category_name.toLowerCase() === selectedCat.name.toLowerCase());
      }
    }

    // 5. Emergency only
    if (isEmergencyOnly) {
      result = result.filter((r) => r.is_emergency);
    }

    // 6. Date Range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      result = result.filter((r) => {
        const itemDate = new Date(r.created_at);
        if (dateRangeFilter === 'today') {
          return itemDate.toDateString() === now.toDateString();
        } else if (dateRangeFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= sevenDaysAgo;
        } else if (dateRangeFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= thirtyDaysAgo;
        }
        return true;
      });
    }

    // 7. Multi-field Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'priority') {
        const wA = PRIORITY_WEIGHT[a.priority] || 0;
        const wB = PRIORITY_WEIGHT[b.priority] || 0;
        comparison = wA - wB;
      } else if (sortField === 'status') {
        const wA = STATUS_WEIGHT[a.status] || 0;
        const wB = STATUS_WEIGHT[b.status] || 0;
        comparison = wA - wB;
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        comparison = valA.localeCompare(valB);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [reports, searchQuery, statusFilter, priorityFilter, categoryIdFilter, isEmergencyOnly, dateRangeFilter, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReports.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReports = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedReports.slice(start, start + pageSize);
  }, [filteredAndSortedReports, safeCurrentPage, pageSize]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !internalNoteInput.trim()) return;

    try {
      setIsSubmittingNote(true);
      await api.addCrimeReportNote(detail.id, internalNoteInput.trim());
      const updated = await api.getCrimeReportDetail(detail.id);
      setDetail(updated);
      setInternalNoteInput('');
    } catch (err: any) {
      alert(err.message || 'Error al registrar nota');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const renderSortHeader = (field: SortField, label: string, className = '') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3.5 px-4 cursor-pointer select-none transition-colors hover:text-white group ${
          isActive ? 'text-sky-400 bg-slate-900/60 font-bold' : 'text-slate-400'
        } ${className}`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{label}</span>
          {isActive ? (
            sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </div>
      </th>
    );
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      todos: reports.length,
      pendiente: 0,
      en_revision: 0,
      en_atencion: 0,
      derivado: 0,
      resuelto: 0,
      archivado: 0,
      rechazado: 0,
      sos: 0,
    };
    reports.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
      if (r.is_emergency) counts.sos++;
    });
    return counts;
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-sky-400" />
            Bandeja de Delitos & Denuncias Anónimas (MS-02)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión y seguimiento de denuncias ciudadanas sin registro con sanitización de metadatos EXIF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-white border-slate-700 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Limpiar Filtros
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleManualRefresh} className="whitespace-nowrap">
            Refrescar Bandeja
          </Button>
        </div>
      </div>

      {/* Quick Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => {
            handleStatusFilterChange('');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('pendiente');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('en_revision');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('en_atencion');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('derivado');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('resuelto');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('archivado');
            setIsEmergencyOnly(false);
          }}
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
          onClick={() => {
            handleStatusFilterChange('rechazado');
            setIsEmergencyOnly(false);
          }}
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
          onClick={handleEmergencyToggle}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
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
            onChange={(e) => handlePriorityFilterChange(e.target.value)}
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
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            options={[
              { value: '', label: 'Todas las Categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            value={dateRangeFilter}
            onChange={(e) => handleDateRangeFilterChange(e.target.value)}
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
            Filtrados <span className="text-white font-bold">{filteredAndSortedReports.length}</span> de{' '}
            <span className="text-slate-300 font-bold">{reports.length}</span> denuncias
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

      {/* Reports Table / Card List */}
      <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <div className="overflow-x-auto">
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
              ) : filteredAndSortedReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se encontraron denuncias con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((r) => {
                  const prioStyle = getPriorityStyles(r.priority);
                  const statusStyle = getStatusStyles(r.status);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => openCrimeReportModal(r.id)}
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap shrink-0 inline-flex items-center ${prioStyle.badge}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${statusStyle.bg}`}>
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

        {/* Table Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 font-mono text-xs cursor-pointer"
            >
              <option value={5}>5 por pág.</option>
              <option value={10}>10 por pág.</option>
              <option value={20}>20 por pág.</option>
              <option value={50}>50 por pág.</option>
            </select>
            <span className="text-slate-500 font-mono text-[11px]">
              {filteredAndSortedReports.length > 0
                ? `${(safeCurrentPage - 1) * pageSize + 1} - ${Math.min(safeCurrentPage * pageSize, filteredAndSortedReports.length)} de ${filteredAndSortedReports.length}`
                : '0 de 0'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
              title="Primera página"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="h-7.5 px-2 text-xs border-slate-800 disabled:opacity-30"
              title="Última página"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedCrimeReportId}
        onClose={closeCrimeReportModal}
        title={detail ? `Expediente Policial: ${detail.public_code}` : 'Cargando expediente...'}
        subtitle={detail ? `Categoría: ${detail.category?.name || 'Delito'} • Reportado ${formatDateTime(detail.created_at)}` : ''}
        maxWidth="4xl"
      >
        {isLoadingDetail || !detail ? (
          <div className="py-16 text-center text-slate-400">Cargando datos del expediente...</div>
        ) : (
          <div className="space-y-6 text-left">
            {/* Urgency Alert Header */}
            {detail.is_emergency && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-xs font-semibold text-red-200">
                  CASO MARCADO COMO EMERGENCIA SOS POR EL DENUNCIANTE ANÓNIMO. REQUIERE INTERVENCIÓN INMEDIATA.
                </p>
              </div>
            )}

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Facts & Location */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Descripción del Hecho
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {detail.description}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    Lugar y Referencias
                  </h4>
                  <p className="text-sm font-semibold text-white">
                    {detail.address_reference || 'Sin dirección específica'}
                  </p>
                  {detail.location_note && (
                    <p className="text-xs text-slate-400 italic mt-1">
                      Nota de ubicación: {detail.location_note}
                    </p>
                  )}
                  {detail.latitude && detail.longitude && (
                    <div className="pt-2 text-xs font-mono text-sky-400">
                      Coordenadas GPS: {Number(detail.latitude).toFixed(6)}, {Number(detail.longitude).toFixed(6)}
                    </div>
                  )}
                </div>

                {/* Evidence / Photos */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                      Evidencias Adjuntas ({detail.media?.length || 0})
                    </h4>
                    {detail.media?.length > 0 && (
                      <span className="text-[11px] text-sky-400 font-mono">
                        Clic para ampliar
                      </span>
                    )}
                  </div>

                  {detail.media?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No se adjuntaron fotos o videos.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detail.media?.map((m, idx) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setEvidenceInitialIndex(idx);
                            setIsEvidenceModalOpen(true);
                          }}
                          className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center cursor-pointer hover:border-sky-500/60 transition-all shadow-md"
                        >
                          <img
                            src={m.thumbnail_url || m.download_url}
                            alt={`Evidencia delito ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1 text-xs font-bold">
                            <Eye className="w-5 h-5 text-sky-300" />
                            <span>Ver prueba {idx + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Status Transition & Audit Trail */}
              <div className="space-y-4">
                <WorkflowActionPanel
                  reportId={detail.id}
                  reportType="crime"
                  currentStatus={detail.status}
                  reportCode={detail.public_code}
                  onTransitionComplete={async () => {
                    // Refresh detail
                    const updated = await api.getCrimeReportDetail(detail.id);
                    setDetail(updated);
                    fetchReports();
                  }}
                />

                {/* Internal Officer Notes */}
                <form
                  onSubmit={handleAddNote}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Agregar Nota Confidencial PNP
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Anotación reservada para el turno..."
                      value={internalNoteInput}
                      onChange={(e) => setInternalNoteInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <Button type="submit" variant="secondary" size="sm" isLoading={isSubmittingNote}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </form>

                {/* Status History Trail */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Historial de Trazabilidad
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detail.status_history?.map((h, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-sky-400 font-mono uppercase">
                            {h.new_status}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {formatDateTime(h.created_at)}
                          </span>
                        </div>
                        {h.note && <p className="text-slate-300 text-[11px]">{h.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Evidence Viewer Carousel Lightbox */}
      {detail && (
        <EvidenceViewerModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          items={
            detail.media?.map((m) => ({
              id: m.id,
              url: m.download_url,
              thumbnailUrl: m.thumbnail_url,
              sizeBytes: m.size_bytes,
              mediaType: m.media_type,
            })) || []
          }
          initialIndex={evidenceInitialIndex}
          reportCode={detail.public_code}
          categoryName={detail.category?.name}
        />
      )}
    </div>
  );
};
