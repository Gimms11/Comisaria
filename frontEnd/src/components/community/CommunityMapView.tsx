import React, { useEffect, useState, useMemo } from 'react';
import {
  MapPin,
  Share2,
  Eye,
  Image as ImageIcon,
  Search,
  RotateCcw,
  SlidersHorizontal,
  LayoutList,
  Map as MapIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../services/api';
import { Category, CommunityReportDetail, CommunityReportListItem } from '../../types';
import { useUiStore } from '../../stores/uiStore';
import { useWebSocketStore } from '../../stores/websocketStore';
import { EvidenceViewerModal } from '../ui/EvidenceViewerModal';
import { WorkflowActionPanel } from '../ui/WorkflowActionPanel';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { formatDateTime, formatTimeAgo, getPriorityStyles, getStatusStyles } from '../../lib/utils';

// Custom Leaflet Icons using SVG
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const pinPending = createCustomIcon('#eab308'); // yellow
const pinRevision = createCustomIcon('#3b82f6'); // blue
const pinEnAtencion = createCustomIcon('#6366f1'); // indigo
const pinDerivado = createCustomIcon('#a855f7'); // purple
const pinResuelto = createCustomIcon('#10b981'); // green
const pinArchivado = createCustomIcon('#64748b'); // slate
const pinRechazado = createCustomIcon('#e11d48'); // rose
const pinDefault = createCustomIcon('#0284c7'); // sky

type SortField =
  | 'public_code'
  | 'category_name'
  | 'description'
  | 'address_reference'
  | 'priority'
  | 'status'
  | 'shares_count'
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

// Coordenadas default de La Tinguiña, Ica, Perú
const DEFAULT_CENTER: [number, number] = [-14.0321, -75.7289];
const MIN_ZOOM = 12;
const MAX_ZOOM = 18;
// Bounding box para limitar paneo fuera de Ica / La Tinguiña
const DISTRICT_BOUNDS: [[number, number], [number, number]] = [
  [-14.16, -75.86],
  [-13.90, -75.60],
];

// Componente puente para sincronizar el zoom y centrado de Leaflet con el estado de React
const MapBridge: React.FC<{
  currentZoom: number;
  onZoomChange: (z: number) => void;
  resetSignal: number;
}> = ({ currentZoom, onZoomChange, resetSignal }) => {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    if (map.getZoom() !== currentZoom) {
      map.setZoom(currentZoom);
    }
  }, [currentZoom, map]);

  useEffect(() => {
    if (resetSignal > 0) {
      map.setView(DEFAULT_CENTER, 14, { animate: true });
      onZoomChange(14);
    }
  }, [resetSignal, map, onZoomChange]);

  return null;
};

export const CommunityMapView: React.FC = () => {
  const { selectedCommunityReportCode, openCommunityReportModal, closeCommunityReportModal } =
    useUiStore();
  const { latestAlert } = useWebSocketStore();

  const [reports, setReports] = useState<CommunityReportListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CommunityReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Map Zoom & Center Control State
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [resetMapSignal, setResetMapSignal] = useState<number>(0);

  // View Mode: 'map' | 'table'
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryIdFilter, setCategoryIdFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  // Interactive Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State for Table View
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Evidence Lightbox State
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceInitialIndex, setEvidenceInitialIndex] = useState(0);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.listCommunityReports({ limit: 200 });
      setReports(res?.items || []);
    } catch (e) {
      console.warn('Error al cargar reportes comunitarios:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await api.listCommunityCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al listar categorías comunitarias:', e);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchCategories();
  }, []);

  // Recarga reactiva en tiempo real al registrarse reporte comunitario o cambiar estado
  useEffect(() => {
    if (
      latestAlert &&
      (latestAlert.event_type === 'NEW_COMMUNITY_REPORT' || latestAlert.event_type === 'STATUS_CHANGED')
    ) {
      fetchReports();
    }
  }, [latestAlert]);

  // Cargar detalle del modal
  useEffect(() => {
    if (selectedCommunityReportCode) {
      setIsLoadingDetail(true);
      api
        .getCommunityReportByCode(selectedCommunityReportCode)
        .then((data) => setSelectedReport(data))
        .catch((err) => console.error('Error al cargar reporte vecinal:', err))
        .finally(() => setIsLoadingDetail(false));
    } else {
      setSelectedReport(null);
    }
  }, [selectedCommunityReportCode]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'priority' || field === 'created_at' || field === 'shares_count' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryIdFilter('');
    setDateRangeFilter('all');
    setSortField('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Reset page to 1 whenever any filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, categoryIdFilter, dateRangeFilter]);

  const handleResetMapView = () => {
    setResetMapSignal((prev) => prev + 1);
  };

  const getZoomLabel = (zoom: number) => {
    if (zoom <= 12) return 'Distrito Amplio (12x)';
    if (zoom === 13) return 'Sector Urbano (13x)';
    if (zoom === 14) return 'La Tinguiña Centro (14x)';
    if (zoom === 15) return 'Barrios y Avenidas (15x)';
    if (zoom === 16) return 'Nivel Manzana (16x)';
    if (zoom === 17) return 'Nivel Calle (17x)';
    return 'Detalle Predial Máximo (18x)';
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(statusFilter) ||
    Boolean(priorityFilter) ||
    Boolean(categoryIdFilter) ||
    dateRangeFilter !== 'all';

  // Filter & Sort Pipeline across ALL items
  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    // Search filter across all fields
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

    // Status filter
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter) {
      result = result.filter((r) => r.priority === priorityFilter);
    }

    // Category filter
    if (categoryIdFilter) {
      const selectedCat = categories.find((c) => c.id === categoryIdFilter);
      if (selectedCat) {
        result = result.filter((r) => r.category_name.toLowerCase() === selectedCat.name.toLowerCase());
      }
    }

    // Date Range
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

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'priority') {
        comparison = (PRIORITY_WEIGHT[a.priority] || 0) - (PRIORITY_WEIGHT[b.priority] || 0);
      } else if (sortField === 'status') {
        comparison = (STATUS_WEIGHT[a.status] || 0) - (STATUS_WEIGHT[b.status] || 0);
      } else if (sortField === 'shares_count') {
        comparison = (a.shares_count || 0) - (b.shares_count || 0);
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
  }, [reports, categories, searchQuery, statusFilter, priorityFilter, categoryIdFilter, dateRangeFilter, sortField, sortOrder]);

  // Pagination calculation for Table View
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReports.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReports = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedReports.slice(start, start + pageSize);
  }, [filteredAndSortedReports, safeCurrentPage, pageSize]);

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
    };
    reports.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [reports]);

  const renderSortHeader = (field: SortField, label: string, className = '') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-purple-400" />
            Centro de Control de Reportes Ciudadanos (MS-03)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Geolocalización en tiempo real de incidencias cívicas, luminarias, baches y articulación con Serenazgo de La Tinguiña.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'map' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Mapa y Panel</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'table' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Tabla Completa</span>
            </button>
          </div>

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
          <Button variant="primary" size="sm" onClick={fetchReports} className="whitespace-nowrap">
            Refrescar
          </Button>
        </div>
      </div>

      {/* Quick Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            !statusFilter
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {statusCounts.todos}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pendiente')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'pendiente'
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
          onClick={() => setStatusFilter('en_revision')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'en_revision'
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
          onClick={() => setStatusFilter('derivado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'derivado'
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
          onClick={() => setStatusFilter('en_atencion')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'en_atencion'
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
          onClick={() => setStatusFilter('resuelto')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'resuelto'
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
          onClick={() => setStatusFilter('archivado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'archivado'
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
          onClick={() => setStatusFilter('rechazado')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'rechazado'
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
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/80 border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Buscar código (LT-2026-...), calle o detalle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <Select
            value={categoryIdFilter}
            onChange={(e) => setCategoryIdFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las Categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
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
            onChange={(e) => setDateRangeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las Fechas' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Últimos 7 días' },
              { value: 'month', label: 'Este mes' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            Filtrados <span className="text-purple-400 font-bold">{filteredAndSortedReports.length}</span> de{' '}
            <span className="text-white font-bold">{reports.length}</span> incidentes vecinales
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

      {/* View Mode 1: Map & Sidebar Layout */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map (8 cols) */}
          <div className="lg:col-span-8 h-[600px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative group">
            {/* Custom Interactive Zoom Control Bar Overlay */}
            <div className="absolute top-4 left-4 z-20 glass-panel rounded-2xl p-2.5 border border-slate-700/90 bg-slate-950/90 shadow-2xl backdrop-blur-md flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMapZoom((prev) => Math.max(MIN_ZOOM, prev - 1))}
                  disabled={mapZoom <= MIN_ZOOM}
                  title="Alejar mapa"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Tactical Zoom Slider */}
                <div className="flex items-center gap-2 px-2">
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={1}
                    value={mapZoom}
                    onChange={(e) => setMapZoom(Number(e.target.value))}
                    className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMapZoom((prev) => Math.min(MAX_ZOOM, prev + 1))}
                  disabled={mapZoom >= MAX_ZOOM}
                  title="Acercar mapa"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-800" />

              {/* Zoom Level Label */}
              <div className="text-[11px] font-mono font-semibold text-purple-300 whitespace-nowrap min-w-[130px]">
                {getZoomLabel(mapZoom)}
              </div>

              <div className="h-4 w-px bg-slate-800" />

              {/* Reset Center Button */}
              <button
                type="button"
                onClick={handleResetMapView}
                title="Centrar en La Tinguiña"
                className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900/90 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <LocateFixed className="w-3.5 h-3.5 text-purple-400" />
                <span>Tinguiña</span>
              </button>
            </div>

            <MapContainer
              center={DEFAULT_CENTER}
              zoom={mapZoom}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              maxBounds={DISTRICT_BOUNDS}
              maxBoundsViscosity={1.0}
              zoomControl={false}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
              />

              <MapBridge
                currentZoom={mapZoom}
                onZoomChange={setMapZoom}
                resetSignal={resetMapSignal}
              />

              {filteredAndSortedReports.map((r) => {
                // Si no tiene coords, emular dentro de La Tinguiña
                const lat = r.latitude || -14.0321 + (Math.sin(r.public_code.length) * 0.008);
                const lng = r.longitude || -75.7289 + (Math.cos(r.public_code.length) * 0.008);

                const pinIcon =
                  r.status === 'pendiente'
                    ? pinPending
                    : r.status === 'en_revision'
                    ? pinRevision
                    : r.status === 'derivado'
                    ? pinDerivado
                    : r.status === 'en_atencion'
                    ? pinEnAtencion
                    : r.status === 'resuelto'
                    ? pinResuelto
                    : r.status === 'archivado'
                    ? pinArchivado
                    : r.status === 'rechazado'
                    ? pinRechazado
                    : pinDefault;

                return (
                  <Marker key={r.id} position={[lat, lng]} icon={pinIcon}>
                    <Popup>
                      <div className="text-left space-y-1.5 p-1 min-w-[200px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-sky-400 whitespace-nowrap">
                            {r.public_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {formatTimeAgo(r.created_at)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">{r.category_name}</p>
                        <p className="text-xs text-slate-300 line-clamp-2">{r.description}</p>
                        <div className="pt-2 flex items-center justify-between border-t border-slate-800 mt-1">
                          <span className="text-[11px] text-purple-400 font-semibold whitespace-nowrap">
                            {r.shares_count} difusiones
                          </span>
                          <button
                            onClick={() => openCommunityReportModal(r.public_code)}
                            className="text-xs text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
                          >
                            Ver / Derivar
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 glass-panel rounded-xl p-3 text-xs space-y-1.5 border border-slate-700/80 bg-slate-950/90 shadow-xl">
              <p className="font-bold text-slate-300 font-mono text-[11px] mb-1">ESTADOS VECINALES</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                <span className="text-slate-300 whitespace-nowrap">Pendiente de Atención</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                <span className="text-slate-300 whitespace-nowrap">Derivado a Serenazgo / Muni</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-slate-300 whitespace-nowrap">En Atención (Cuadrilla en Sitio)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-300 whitespace-nowrap">Resuelto / Concluido</span>
              </div>
            </div>
          </div>

          {/* Incident List & Derivation Hub (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-slate-900/90 border-slate-800 h-[600px] flex flex-col">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Incidentes Vecinales</span>
                  <span className="text-xs font-mono font-normal text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {filteredAndSortedReports.length} filtrados
                  </span>
                </CardTitle>
              </CardHeader>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {isLoading ? (
                  <p className="text-center py-10 text-slate-500 text-xs">Cargando mapa...</p>
                ) : filteredAndSortedReports.length === 0 ? (
                  <p className="text-center py-10 text-slate-500 text-xs">Sin reportes con los filtros seleccionados</p>
                ) : (
                  filteredAndSortedReports.map((r) => {
                    const statusStyle = getStatusStyles(r.status);
                    const prioStyle = getPriorityStyles(r.priority);
                    return (
                      <div
                        key={r.id}
                        onClick={() => openCommunityReportModal(r.public_code)}
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
                          <span className={`px-2 py-0.5 rounded border font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${statusStyle.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} shrink-0`} />
                            {statusStyle.label}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase whitespace-nowrap shrink-0 ${prioStyle.badge}`}>
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
          </div>
        </div>
      )}

      {/* View Mode 2: Full Table View with interactive sort and pagination */}
      {viewMode === 'table' && (
        <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
          <div className="overflow-x-auto">
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
                ) : filteredAndSortedReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No se encontraron reportes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedReports.map((r) => {
                    const prioStyle = getPriorityStyles(r.priority);
                    const statusStyle = getStatusStyles(r.status);

                    return (
                      <tr
                        key={r.id}
                        onClick={() => openCommunityReportModal(r.public_code)}
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
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500 font-mono text-xs cursor-pointer"
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
                <span className="font-bold text-purple-400">{safeCurrentPage}</span>
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
      )}

      {/* Community Report Detail & Derivation Modal */}
      <Modal
        isOpen={!!selectedCommunityReportCode}
        onClose={closeCommunityReportModal}
        title={selectedReport ? `Reporte Vecinal: ${selectedReport.public_code}` : 'Cargando...'}
        subtitle={
          selectedReport
            ? `${selectedReport.category?.name} • Registrado ${formatDateTime(
                selectedReport.created_at
              )}`
            : ''
        }
        maxWidth="2xl"
      >
        {isLoadingDetail || !selectedReport ? (
          <div className="py-12 text-center text-slate-400">Cargando reporte vecinal...</div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Descripción de la Incidencia
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedReport.description}
              </p>
            </div>

            {/* Photos attached */}
            {selectedReport.media_urls?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    Fotos de la Incidencia ({selectedReport.media_urls.length})
                  </h4>
                  <span className="text-[11px] text-purple-400 font-mono">Clic para ampliar</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedReport.media_urls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setEvidenceInitialIndex(idx);
                        setIsEvidenceModalOpen(true);
                      }}
                      className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center cursor-pointer hover:border-purple-500/60 transition-all shadow-md"
                    >
                      <img
                        src={url}
                        alt={`Evidencia urbana ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1 text-xs font-bold">
                        <Eye className="w-5 h-5 text-purple-300" />
                        <span>Ver foto {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Action Panel for Community Reports */}
            <WorkflowActionPanel
              reportId={selectedReport.id}
              reportType="community"
              currentStatus={selectedReport.status}
              reportCode={selectedReport.public_code}
              onTransitionComplete={async () => {
                const updated = await api.getCommunityReportByCode(selectedReport.public_code);
                setSelectedReport(updated);
                fetchReports();
              }}
            />

            {/* History Trail */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Trazabilidad y Constancias
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedReport.status_history?.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-400 font-mono uppercase">
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
        )}
      </Modal>

      {/* Evidence Viewer Modal */}
      {selectedReport && selectedReport.media_urls && selectedReport.media_urls.length > 0 && (
        <EvidenceViewerModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          items={selectedReport.media_urls.map((url, idx) => ({
            id: String(idx),
            url: url,
            thumbnailUrl: url,
            mediaType: 'foto',
          }))}
          initialIndex={evidenceInitialIndex}
          reportCode={selectedReport.public_code}
          categoryName={selectedReport.category?.name}
        />
      )}
    </div>
  );
};
