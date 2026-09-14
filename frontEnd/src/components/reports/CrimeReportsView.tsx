import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { Category, CrimeReportDetail, CrimeReportListItem } from '../../types';
import { useUiStore } from '../../stores/uiStore';
import { useWebSocketStore } from '../../stores/websocketStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getPriorityStyles, getStatusStyles } from '../../lib/utils';
import { CrimeReportsFilterBar } from './CrimeReportsFilterBar';
import { CrimeReportsTable } from './CrimeReportsTable';
import { CrimeReportsCardList } from './CrimeReportsCardList';
import { CrimeReportsPagination } from './CrimeReportsPagination';
import { CrimeReportDetailModal } from './CrimeReportDetailModal';

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

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Detail State
  const [detail, setDetail] = useState<CrimeReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.listCrimeReports({ limit: 100 });
      setReports(res.items || []);
    } catch (e) {
      console.warn('Error al cargar delitos:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.listCrimeCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al cargar categorías:', e);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const data = await api.getCrimeReportDetail(id);
      setDetail(data);
    } catch (err) {
      console.warn('Error al cargar detalle del reporte:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchReports();
  }, [fetchCategories, fetchReports]);

  useEffect(() => {
    if (selectedCrimeReportId) {
      // Resolver a UUID si se pasó un public_code desde alertas o banners
      const matched = reports.find(
        (r) =>
          r.id === selectedCrimeReportId ||
          r.public_code.toLowerCase() === selectedCrimeReportId.toLowerCase()
      );
      const targetId = matched ? matched.id : selectedCrimeReportId;
      fetchDetail(targetId);
    } else {
      setDetail(null);
    }
  }, [selectedCrimeReportId, reports, fetchDetail]);

  useEffect(() => {
    if (latestAlert && (latestAlert.event_type === 'NEW_CRIME_REPORT' || latestAlert.event_type === 'STATUS_CHANGED')) {
      fetchReports();
    }
  }, [latestAlert, fetchReports]);

  // Filtering Logic
  const filteredReports = useMemo(() => {
    const selectedCategory = categories.find((c) => c.id === categoryIdFilter);
    return reports.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (selectedCategory && r.category_name.toLowerCase() !== selectedCategory.name.toLowerCase()) return false;
      if (isEmergencyOnly && !r.is_emergency) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = r.public_code.toLowerCase().includes(q);
        const descMatch = r.description.toLowerCase().includes(q);
        const catMatch = r.category_name?.toLowerCase().includes(q);
        const locMatch = r.address_reference?.toLowerCase().includes(q);
        if (!codeMatch && !descMatch && !catMatch && !locMatch) return false;
      }

      if (dateRangeFilter !== 'all') {
        const itemDate = new Date(r.created_at);
        const now = new Date();
        if (dateRangeFilter === 'today') {
          const isToday = itemDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateRangeFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo) return false;
        } else if (dateRangeFilter === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [reports, statusFilter, priorityFilter, categoryIdFilter, isEmergencyOnly, searchQuery, dateRangeFilter]);

  // Sorting Logic
  const filteredAndSortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'priority') {
        comparison = (PRIORITY_WEIGHT[a.priority] || 0) - (PRIORITY_WEIGHT[b.priority] || 0);
      } else if (sortField === 'status') {
        comparison = (STATUS_WEIGHT[a.status] || 0) - (STATUS_WEIGHT[b.status] || 0);
      } else if (sortField === 'public_code') {
        comparison = a.public_code.localeCompare(b.public_code);
      } else if (sortField === 'category_name') {
        comparison = (a.category_name || '').localeCompare(b.category_name || '');
      } else if (sortField === 'description') {
        comparison = a.description.localeCompare(b.description);
      } else if (sortField === 'address_reference') {
        comparison = (a.address_reference || '').localeCompare(b.address_reference || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredReports, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReports.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedReports = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedReports.slice(start, start + pageSize);
  }, [filteredAndSortedReports, safeCurrentPage, pageSize]);

  const handleSort = (field: string) => {
    const sField = field as SortField;
    if (sortField === sField) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(sField);
      setSortOrder('desc');
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryIdFilter('');
    setSearchQuery('');
    setIsEmergencyOnly(false);
    setDateRangeFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    statusFilter ||
      priorityFilter ||
      categoryIdFilter ||
      searchQuery ||
      isEmergencyOnly ||
      dateRangeFilter !== 'all'
  );

  const statusCounts = useMemo(() => {
    const counts = {
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
      if (r.status in counts) {
        counts[r.status as keyof typeof counts]++;
      }
      if (r.is_emergency) counts.sos++;
    });
    return counts;
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400 shrink-0" />
            </div>
            <span>Bandeja de Delitos & Denuncias</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Seguimiento táctico de denuncias ciudadanas y protección de metadatos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
          <Button variant="primary" size="sm" onClick={fetchReports} className="whitespace-nowrap shrink-0">
            Refrescar Bandeja
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <CrimeReportsFilterBar
        statusFilter={statusFilter}
        isEmergencyOnly={isEmergencyOnly}
        searchQuery={searchQuery}
        priorityFilter={priorityFilter}
        categoryIdFilter={categoryIdFilter}
        dateRangeFilter={dateRangeFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        categories={categories}
        statusCounts={statusCounts}
        totalFiltered={filteredAndSortedReports.length}
        totalAll={reports.length}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(1);
        }}
        onEmergencyToggle={() => {
          setIsEmergencyOnly((prev) => !prev);
          setCurrentPage(1);
        }}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        onPriorityChange={(p) => {
          setPriorityFilter(p);
          setCurrentPage(1);
        }}
        onCategoryChange={(c) => {
          setCategoryIdFilter(c);
          setCurrentPage(1);
        }}
        onDateRangeChange={(d) => {
          setDateRangeFilter(d);
          setCurrentPage(1);
        }}
      />

      {/* Data Container: Mobile Cards (< md) + Desktop Table (>= md) + Pagination */}
      <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <CrimeReportsCardList
          reports={paginatedReports}
          isLoading={isLoading}
          onSelectReport={openCrimeReportModal}
          getPriorityStyles={getPriorityStyles}
          getStatusStyles={getStatusStyles}
        />

        <CrimeReportsTable
          reports={paginatedReports}
          isLoading={isLoading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSelectReport={openCrimeReportModal}
          getPriorityStyles={getPriorityStyles}
          getStatusStyles={getStatusStyles}
        />

        <CrimeReportsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAndSortedReports.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Detail Inspection Modal */}
      <CrimeReportDetailModal
        isOpen={Boolean(selectedCrimeReportId)}
        onClose={closeCrimeReportModal}
        reportId={selectedCrimeReportId}
        detail={detail}
        isLoading={isLoadingDetail}
        onReportUpdated={async () => {
          if (selectedCrimeReportId) {
            await fetchDetail(selectedCrimeReportId);
          }
          await fetchReports();
        }}
      />
    </div>
  );
};
