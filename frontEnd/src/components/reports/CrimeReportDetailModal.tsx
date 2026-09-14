import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Send,
  AlertCircle,
  Eye,
  ImageIcon,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EvidenceViewerModal } from '../ui/EvidenceViewerModal';
import { WorkflowActionPanel } from '../ui/WorkflowActionPanel';
import { CrimeReportDetail } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { api } from '../../services/api';

interface CrimeReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  detail: CrimeReportDetail | null;
  isLoading: boolean;
  onReportUpdated: () => void;
}

export const CrimeReportDetailModal: React.FC<CrimeReportDetailModalProps> = ({
  isOpen,
  onClose,
  reportId: _reportId,
  detail,
  isLoading,
  onReportUpdated,
}) => {
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceInitialIndex, setEvidenceInitialIndex] = useState(0);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !internalNoteInput.trim()) return;
    try {
      setIsSubmittingNote(true);
      await api.addCrimeReportNote(detail.id, internalNoteInput.trim());
      setInternalNoteInput('');
      onReportUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al agregar nota interna');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={detail ? `Expediente Policial: ${detail.public_code}` : 'Cargando expediente...'}
        subtitle={
          detail
            ? `Categoría: ${detail.category?.name || 'Delito'} • Reportado ${formatDateTime(detail.created_at)}`
            : ''
        }
        maxWidth="4xl"
      >
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs animate-pulse">
            Cargando expediente policial y evidencias...
          </div>
        ) : !detail ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-200">
              No se pudo cargar el detalle del expediente solicitado.
            </p>
            <p className="text-xs text-slate-400">
              Es posible que el reporte aún se esté sincronizando en el sistema.
            </p>
            <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-xs">
              Cerrar Expediente
            </Button>
          </div>
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
                  onTransitionComplete={onReportUpdated}
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
    </>
  );
};
