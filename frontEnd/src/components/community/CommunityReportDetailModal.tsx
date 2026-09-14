import React, { useEffect, useState } from 'react';
import { Eye, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { EvidenceViewerModal } from '../ui/EvidenceViewerModal';
import { WorkflowActionPanel } from '../ui/WorkflowActionPanel';
import { CommunityReportDetail } from '../../types';
import { api } from '../../services/api';
import { formatDateTime } from '../../lib/utils';

interface CommunityReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportCode: string | null;
  onReportUpdated: () => void;
}

export const CommunityReportDetailModal: React.FC<CommunityReportDetailModalProps> = ({
  isOpen,
  onClose,
  reportCode,
  onReportUpdated,
}) => {
  const [selectedReport, setSelectedReport] = useState<CommunityReportDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceInitialIndex, setEvidenceInitialIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (reportCode && isOpen) {
      setIsLoadingDetail(true);
      api
        .getCommunityReportByCode(reportCode)
        .then((data) => {
          if (isMounted) setSelectedReport(data);
        })
        .catch((e) => console.warn('Error al cargar detalle vecinal:', e))
        .finally(() => {
          if (isMounted) setIsLoadingDetail(false);
        });
    } else {
      setSelectedReport(null);
    }
    return () => {
      isMounted = false;
    };
  }, [reportCode, isOpen]);

  const handleTransitionComplete = async () => {
    if (!reportCode) return;
    try {
      const updated = await api.getCommunityReportByCode(reportCode);
      setSelectedReport(updated);
      onReportUpdated();
    } catch (e) {
      console.warn('Error al refrescar detalle tras transición:', e);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
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
              onTransitionComplete={handleTransitionComplete}
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
    </>
  );
};
