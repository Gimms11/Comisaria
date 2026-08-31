import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { Badge } from './Badge';
import { TransitionOption, ReportStatus } from '../../types';
import { getStatusStyles } from '../../lib/utils';
import {
  CheckCircle2,
  XCircle,
  Send,
  Shield,
  Archive,
  Eye,
  RotateCcw,
  LucideIcon,
  AlertCircle,
  UploadCloud,
  X,
  Radio,
} from 'lucide-react';

interface WorkflowActionPanelProps {
  reportId: string;
  reportType: 'crime' | 'community';
  currentStatus: ReportStatus;
  reportCode?: string;
  onTransitionComplete: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  send: Send,
  shield: Shield,
  archive: Archive,
  eye: Eye,
  'rotate-ccw': RotateCcw,
};

const COLOR_MAP: Record<string, string> = {
  slate: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  sky: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30',
  blue: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30',
  emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
  green: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
  red: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
  amber: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
  yellow: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
  purple: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
};

interface StepDef {
  key: string;
  label: string;
  sublabel: string;
  matches: (status: ReportStatus) => boolean;
}

const getSteps = (type: 'crime' | 'community', currentStatus: ReportStatus): StepDef[] => {
  if (type === 'crime') {
    return [
      {
        key: 'pendiente',
        label: 'Pendiente',
        sublabel: 'Ingreso Anónimo',
        matches: (s) => s === 'pendiente',
      },
      {
        key: 'en_revision',
        label: 'En Revisión',
        sublabel: 'Pesquisa PNP',
        matches: (s) => s === 'en_revision',
      },
      {
        key: 'en_atencion_o_derivado',
        label: currentStatus === 'derivado' ? 'Derivado' : 'En Atención',
        sublabel: currentStatus === 'derivado' ? 'Fiscalía / Depincri' : 'Patrullaje PNP',
        matches: (s) => s === 'en_atencion' || s === 'derivado',
      },
      {
        key: 'resuelto',
        label: 'Resuelto',
        sublabel: 'Concluido con Acta',
        matches: (s) => s === 'resuelto',
      },
    ];
  } else {
    return [
      {
        key: 'pendiente',
        label: 'Pendiente',
        sublabel: 'Ingreso Vecinal',
        matches: (s) => s === 'pendiente',
      },
      {
        key: 'en_revision',
        label: 'En Revisión',
        sublabel: 'Calificación Cívica',
        matches: (s) => s === 'en_revision',
      },
      {
        key: 'en_atencion_o_derivado',
        label: currentStatus === 'derivado' ? 'Derivado' : 'En Atención',
        sublabel: currentStatus === 'derivado' ? 'Serenazgo / MDLT' : 'Cuadrilla en Sitio',
        matches: (s) => s === 'derivado' || s === 'en_atencion',
      },
      {
        key: 'resuelto',
        label: 'Resuelto',
        sublabel: 'Obra Concluida',
        matches: (s) => s === 'resuelto',
      },
    ];
  }
};

export const WorkflowActionPanel: React.FC<WorkflowActionPanelProps> = ({
  reportId,
  reportType,
  currentStatus,
  reportCode,
  onTransitionComplete,
}) => {
  const [transitions, setTransitions] = useState<TransitionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransition, setSelectedTransition] = useState<TransitionOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [destinationEntity, setDestinationEntity] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransitions();
  }, [reportId, currentStatus]);

  const fetchTransitions = async () => {
    try {
      setLoading(true);
      const data = await api.getAvailableTransitions(reportType, reportId);
      setTransitions(data);
    } catch (err) {
      console.error('Error fetching transitions', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (transition: TransitionOption) => {
    setSelectedTransition(transition);
    setNote('');
    setDestinationEntity('');
    setDocumentNumber('');
    setFiles([]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransition) return;
    if (selectedTransition.min_note_length > 0 && note.length < selectedTransition.min_note_length) {
      setError(`La nota debe tener al menos ${selectedTransition.min_note_length} caracteres.`);
      return;
    }
    if (selectedTransition.requires_evidence && files.length === 0) {
      setError('Debe adjuntar al menos un archivo de evidencia.');
      return;
    }
    if (selectedTransition.requires_destination && !destinationEntity) {
      setError('Debe seleccionar la entidad de destino.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const formData = new FormData();
      formData.append('target_status', selectedTransition.target_status);
      formData.append('note', note);
      if (selectedTransition.requires_destination) {
        formData.append('destination_entity', destinationEntity);
        if (documentNumber) formData.append('document_number', documentNumber);
      }
      files.forEach((file) => {
        formData.append('evidence_files', file);
      });

      await api.executeTransition(reportType, reportId, formData);
      setIsModalOpen(false);
      onTransitionComplete();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar transición');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = getSteps(reportType, currentStatus);
  const currentStepIndex = steps.findIndex((step) => step.matches(currentStatus));
  const isTerminal = currentStatus === 'archivado' || currentStatus === 'rechazado';
  const statusStyle = getStatusStyles(currentStatus);

  const crimeEntities = [
    { value: 'Fiscalía Provincial de Ica', label: 'Fiscalía Provincial de Ica' },
    { value: 'Depincri Ica', label: 'Depincri Ica' },
    { value: 'Comisaría Especializada', label: 'Comisaría Especializada' },
  ];

  const communityEntities = [
    { value: 'Serenazgo Municipal de La Tinguiña', label: 'Serenazgo Municipal de La Tinguiña' },
    { value: 'Subgerencia de Seguridad Ciudadana', label: 'Subgerencia de Seguridad Ciudadana' },
    { value: 'Fiscalización y Control Municipal', label: 'Fiscalización y Control Municipal' },
    { value: 'EMAPICA (Aguas y Desagüe)', label: 'EMAPICA (Aguas y Desagüe)' },
    { value: 'ElectroDunas (Alumbrado Público)', label: 'ElectroDunas (Alumbrado Público)' },
  ];

  const entities = reportType === 'crime' ? crimeEntities : communityEntities;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Header with Title and Current Status Badge */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            Flujo de Vida Operativo {reportCode && <span className="text-sky-400">({reportCode})</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`px-2.5 py-1 text-xs border whitespace-nowrap shrink-0 ${statusStyle.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${statusStyle.dot} shrink-0`} />
            {statusStyle.label}
          </Badge>
        </div>
      </div>

      {/* Stepper */}
      {!isTerminal && (
        <div className="pt-2 pb-6 px-3">
          <div className="relative flex items-center justify-between w-full">
            {/* Background Line */}
            <div className="absolute left-0 top-4 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full" />
            {/* Active Progress Line */}
            <div
              className="absolute left-0 top-4 -translate-y-1/2 h-1 bg-sky-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
              }}
            />
            {steps.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCurrent
                        ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-500/40 scale-110'
                        : isCompleted
                        ? 'bg-sky-900/80 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-700 text-slate-600'
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    ) : (
                      <span className="text-xs font-mono">{idx + 1}</span>
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p
                      className={`text-xs font-bold whitespace-nowrap transition-colors ${
                        isCurrent ? 'text-sky-300' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                      {step.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal States (if applicable) */}
      {isTerminal && (
        <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-left">
            <p className="text-xs font-bold text-rose-300 uppercase font-mono">
              Reporte {currentStatus === 'archivado' ? 'Archivado' : 'Rechazado'}
            </p>
            <p className="text-xs text-rose-400/90 mt-0.5">
              Este caso se encuentra en estado terminal. Para reabrirlo se requiere autorización de Comisario o Administrador con fundamentación.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <h4 className="text-sm font-medium text-slate-400 mb-3">Acciones Disponibles</h4>
        <div className="flex flex-wrap gap-3">
          {loading ? (
            <div className="text-sm text-slate-500">Cargando acciones...</div>
          ) : transitions.length === 0 ? (
            <div className="text-sm text-slate-500">No hay acciones disponibles en el estado actual.</div>
          ) : (
            transitions.map(transition => {
              const Icon = ICON_MAP[transition.icon] || CheckCircle2;
              const colorClass = COLOR_MAP[transition.color] || COLOR_MAP.slate;
              return (
                <button
                  key={transition.target_status}
                  onClick={() => openModal(transition)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${colorClass}`}
                >
                  <Icon className="w-4 h-4" />
                  {transition.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedTransition && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !submitting && setIsModalOpen(false)}
          title={selectedTransition.label}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nota u Observación {selectedTransition.min_note_length > 0 && '*'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-800 border-slate-700 rounded-md text-slate-200 placeholder:text-slate-500 min-h-[100px] resize-none"
                placeholder="Ingrese los detalles de esta acción..."
                required={selectedTransition.min_note_length > 0}
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${note.length < selectedTransition.min_note_length ? 'text-amber-500' : 'text-slate-500'}`}>
                  {note.length} / {selectedTransition.min_note_length || 0} min
                </span>
              </div>
            </div>

            {selectedTransition.requires_destination && (
              <>
                <Select
                  label="Entidad de Destino *"
                  value={destinationEntity}
                  onChange={(e) => setDestinationEntity(e.target.value)}
                  options={[{ value: '', label: '-- Seleccione Entidad --' }, ...entities]}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">N° de Oficio / Documento</label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 rounded-md text-slate-200"
                    placeholder="Ej. OFICIO-001-2026-DIRINCRI"
                  />
                </div>
              </>
            )}

            {selectedTransition.requires_evidence && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Evidencia Adjunta *</label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400 mb-4">Haga clic o arrastre fotos aquí</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm font-medium cursor-pointer transition-colors"
                  >
                    Seleccionar Archivos
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-800 rounded-md text-sm">
                        <span className="text-slate-300 truncate mr-2">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || (selectedTransition.requires_evidence && files.length === 0)}>
                {submitting ? 'Procesando...' : 'Confirmar Acción'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
