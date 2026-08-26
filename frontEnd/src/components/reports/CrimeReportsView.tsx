import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Category,
  CrimeReportDetail,
  CrimeReportListItem,
  ReportPriority,
  ReportStatus,
} from '../../types';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { formatDateTime, formatTimeAgo, getPriorityStyles, getStatusStyles } from '../../lib/utils';

export const CrimeReportsView: React.FC = () => {
  const { selectedCrimeReportId, openCrimeReportModal, closeCrimeReportModal } = useUiStore();
  const { officer } = useAuthStore();

  const [reports, setReports] = useState<CrimeReportListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail State
  const [detail, setDetail] = useState<CrimeReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState<{
    status: ReportStatus;
    note: string;
  }>({ status: 'en_revision', note: '' });
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.listCrimeReports({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category_id: categoryIdFilter || undefined,
        search: searchQuery || undefined,
      });
      setReports(res?.items || []);
    } catch (e) {
      console.warn('Error al listar denuncias:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await api.listCrimeCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al listar categorías:', e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, priorityFilter, categoryIdFilter, searchQuery]);

  // Load modal detail
  useEffect(() => {
    if (selectedCrimeReportId) {
      setIsLoadingDetail(true);
      api
        .getCrimeReportDetail(selectedCrimeReportId)
        .then((data) => {
          setDetail(data);
          setStatusUpdateForm({ status: data.status, note: '' });
        })
        .catch((err) => console.error('Error al cargar detalle:', err))
        .finally(() => setIsLoadingDetail(false));
    } else {
      setDetail(null);
    }
  }, [selectedCrimeReportId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    try {
      setIsSubmittingUpdate(true);
      await api.updateCrimeReportStatus(detail.id, statusUpdateForm);
      // Recargar detalle y lista
      const updated = await api.getCrimeReportDetail(detail.id);
      setDetail(updated);
      setStatusUpdateForm((prev) => ({ ...prev, note: '' }));
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !internalNoteInput.trim()) return;

    try {
      setIsSubmittingUpdate(true);
      await api.addCrimeReportNote(detail.id, internalNoteInput.trim());
      const updated = await api.getCrimeReportDetail(detail.id);
      setDetail(updated);
      setInternalNoteInput('');
    } catch (err: any) {
      alert(err.message || 'Error al registrar nota');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

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
        <Button variant="primary" size="sm" onClick={fetchReports}>
          Refrescar Bandeja
        </Button>
      </div>

      {/* Filter Control Bar */}
      <Card className="bg-slate-900/80 border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por código (LT-2026-...) o texto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
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
            value={categoryIdFilter}
            onChange={(e) => setCategoryIdFilter(e.target.value)}
            options={[
              { value: '', label: 'Todas las Categorías' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </Card>

      {/* Reports Table / Card List */}
      <Card className="bg-slate-900/90 border-slate-800 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Delito / Categoría</th>
                <th className="py-3.5 px-4">Descripción del Hecho</th>
                <th className="py-3.5 px-4">Ubicación / Referencia</th>
                <th className="py-3.5 px-4">Prioridad</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
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
                      onClick={() => openCrimeReportModal(r.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                        {r.public_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          {r.category_name}
                          {r.is_emergency && (
                            <Badge variant="urgent" pulse className="text-[10px] py-0">
                              SOS
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {r.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {r.address_reference || 'La Tinguiña, Ica'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${prioStyle.badge}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${statusStyle.bg}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {formatTimeAgo(r.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    Evidencias Adjuntas ({detail.media?.length || 0})
                  </h4>

                  {detail.media?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No se adjuntaron fotos o videos.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detail.media?.map((m) => (
                        <div
                          key={m.id}
                          className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center"
                        >
                          <img
                            src={m.thumbnail_url || m.download_url}
                            alt="Evidencia delito"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <a
                            href={m.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1.5 text-xs font-bold"
                          >
                            <Download className="w-4 h-4" /> Ver / Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Status Transition & Audit Trail */}
              <div className="space-y-4">
                {/* Status Update Form */}
                <form
                  onSubmit={handleUpdateStatus}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Actualizar Estado Operativo
                  </h4>

                  <Select
                    label="Nuevo Estado"
                    value={statusUpdateForm.status}
                    onChange={(e) =>
                      setStatusUpdateForm((prev) => ({
                        ...prev,
                        status: e.target.value as ReportStatus,
                      }))
                    }
                    options={[
                      { value: 'pendiente', label: 'Pendiente' },
                      { value: 'en_revision', label: 'En Revisión (Asignado a pesquisa)' },
                      { value: 'en_atencion', label: 'En Atención (Patrullaje / Operativo)' },
                      { value: 'derivado', label: 'Derivado a Serenazgo / Fiscalía' },
                      { value: 'resuelto', label: 'Resuelto (Intervención finalizada)' },
                      { value: 'archivado', label: 'Archivado (Sin elementos)' },
                    ]}
                  />

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Motivo / Glosa del Cambio (Visible en seguimiento ciudadano)
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Indique el motivo o instrucción para el ciudadano..."
                      value={statusUpdateForm.note}
                      onChange={(e) =>
                        setStatusUpdateForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    isLoading={isSubmittingUpdate}
                  >
                    Guardar y Firmar Cambio
                  </Button>
                </form>

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
                    <Button type="submit" variant="secondary" size="sm" isLoading={isSubmittingUpdate}>
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
    </div>
  );
};
