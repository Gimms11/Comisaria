import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapPin, RotateCcw, LayoutList, Map as MapIcon } from 'lucide-react';
import { api } from '../../services/api';
import { Category, CommunityReportListItem } from '../../types';
import { useUiStore } from '../../stores/uiStore';
import { useWebSocketStore } from '../../stores/websocketStore';
import { Button } from '../ui/Button';
import { CommunityFilterBar } from './CommunityFilterBar';
import { CommunityMapCanvas } from './CommunityMapCanvas';
import { CommunityIncidentList } from './CommunityIncidentList';
import { CommunityTable, CommunitySortField } from './CommunityTable';
import { CommunityReportDetailModal } from './CommunityReportDetailModal';

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

export const CommunityMapView: React.FC = () => {
  const { selectedCommunityReportCode, openCommunityReportModal, closeCommunityReportModal } =
    useUiStore();
  const { latestAlert } = useWebSocketStore();

  const [reports, setReports] = useState<CommunityReportListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const [sortField, setSortField] = useState<CommunitySortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State for Table View
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.listCommunityReports({ limit: 200 });
      setReports(res?.items || []);
    } catch (e) {
      console.warn('Error al cargar reportes comunitarios:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.listCommunityCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al listar categorías comunitarias:', e);
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
          api.listCommunityReports({ limit: 200 }),
          api.listCommunityCategories(),
        ]);
        if (isMounted) {
          setReports(reportsRes?.items || []);
          setCategories(catsRes || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error inicializando mapa:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Live alerts
  useEffect(() => {
    if (
      latestAlert &&
      (latestAlert.event_type === 'NEW_COMMUNITY_REPORT' || latestAlert.event_type === 'STATUS_CHANGED')
    ) {
      fetchReports();
    }
  }, [latestAlert, fetchReports]);

  // Map Center Reset
  const handleResetMapView = () => {
    setMapZoom(14);
    setResetMapSignal((prev) => prev + 1);
  };

  // Filter Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryIdFilter('');
    setDateRangeFilter('all');
    setCurrentPage(1);
  };

  const handleSort = (field: CommunitySortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(statusFilter) ||
    Boolean(priorityFilter) ||
    Boolean(categoryIdFilter) ||
    dateRangeFilter !== 'all';

  // Filter & Sort Pipeline
  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    // Search filter
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0 flex items-center justify-center">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 shrink-0" />
            </div>
            <span>Centro de Reportes Comunitarios</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Geolocalización de incidencias vecinales y coordinación con Serenazgo de La Tinguiña.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs shrink-0">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'map' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Mapa y Panel</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                viewMode === 'table' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 shrink-0" />
              <span>Tabla Completa</span>
            </button>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-white border-slate-700 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 shrink-0" />
              Limpiar Filtros
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleManualRefresh} className="whitespace-nowrap shrink-0">
            Refrescar
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <CommunityFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        categories={categories}
        categoryIdFilter={categoryIdFilter}
        onCategoryFilterChange={(val) => {
          setCategoryIdFilter(val);
          setCurrentPage(1);
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={(val) => {
          setPriorityFilter(val);
          setCurrentPage(1);
        }}
        dateRangeFilter={dateRangeFilter}
        onDateRangeFilterChange={(val) => {
          setDateRangeFilter(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        statusCounts={statusCounts}
        totalFiltered={filteredAndSortedReports.length}
        totalCount={reports.length}
        sortField={sortField}
        sortOrder={sortOrder}
      />

      {/* View Mode 1: Map & Incident List */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8">
            <CommunityMapCanvas
              reports={filteredAndSortedReports}
              mapZoom={mapZoom}
              onZoomChange={setMapZoom}
              resetSignal={resetMapSignal}
              onResetView={handleResetMapView}
              onSelectReport={openCommunityReportModal}
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <CommunityIncidentList
              reports={filteredAndSortedReports}
              isLoading={isLoading}
              onSelectReport={openCommunityReportModal}
            />
          </div>
        </div>
      )}

      {/* View Mode 2: Full Table View */}
      {viewMode === 'table' && (
        <CommunityTable
          reports={paginatedReports}
          isLoading={isLoading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSelectReport={openCommunityReportModal}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAndSortedReports.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Community Report Detail & Derivation Modal */}
      <CommunityReportDetailModal
        isOpen={Boolean(selectedCommunityReportCode)}
        onClose={closeCommunityReportModal}
        reportCode={selectedCommunityReportCode}
        onReportUpdated={fetchReports}
      />
    </div>
  );
};
