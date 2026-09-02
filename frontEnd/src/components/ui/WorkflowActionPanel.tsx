import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { Badge } from './Badge';
import { TransitionOption, ReportStatus } from '../../types';
import { getStatusStyles } from '../../lib/utils';
import {
  createWorkflowTransitionSchema,
  formatZodErrors,
} from '../../lib/validations';
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
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    setGlobalError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
      if (fieldErrors.files) setFieldErrors((prev) => ({ ...prev, files: '' }));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransition) return;
    setGlobalError(null);
    setFieldErrors({});

    // Dynamic Zod Validation based on transition contract
    const schema = createWorkflowTransitionSchema({
      minNoteLength: selectedTransition.min_note_length,
      requiresEvidence: selectedTransition.requires_evidence,
      requiresDestination: selectedTransition.requires_destination,
    });

    const validationResult = schema.safeParse({
      note,
      destination_entity: destinationEntity || undefined,
      document_number: documentNumber || undefined,
      files,
    });

    if (!validationResult.success) {
      setFieldErrors(formatZodErrors(validationResult.error));
      return;
    }

    try {
      setSubmitting(true);
      setGlobalError(null);
      const formData = new FormData();
      formData.append('target_status', selectedTransition.target_status);
      formData.append('note', validationResult.data.note);
      if (selectedTransition.requires_destination && validationResult.data.destination_entity) {
        formData.append('destination_entity', validationResult.data.destination_entity);
        if (validationResult.data.document_number) {
          formData.append('document_number', validationResult.data.document_number);
        }
      }
      files.forEach((file) => {
        formData.append('evidence_files', file);
      });

      await api.executeTransition(reportType, reportId, formData);
      setIsModalOpen(false);
      onTransitionComplete();
    } catch (err: any) {
      setGlobalError(err.message || 'Error al ejecutar transición de estado');
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6 text-left">
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

      {/* Lifecycle Stepper */}
      <div className="relative pt-2 pb-1">
        <div className="grid grid-cols-4 gap-2 relative">
          {/* Connector Line */}
          <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-slate-800 -z-0" />
          <div
            className="absolute top-4 left-[12.5%] h-0.5 bg-sky-500 transition-all duration-500 -z-0"
            style={{
              width:
                isTerminal || currentStepIndex === -1
                  ? '0%'
                  : `${(currentStepIndex / (steps.length - 1)) * 75}%`,
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = !isTerminal && idx < currentStepIndex;
            const isCurrent = !isTerminal && idx === currentStepIndex;

            return (
              <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                    isCompleted
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-500/20 shadow-lg shadow-sky-600/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-semibold mt-2 whitespace-nowrap ${
                    isCurrent ? 'text-sky-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline whitespace-nowrap">
                  {step.sublabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons Hub */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
          Acciones Disponibles de Turno
        </div>

        <div className="flex flex-wrap gap-2.5">
          {loading ? (
            <div className="text-xs text-slate-500 py-2">Cargando transiciones...</div>
          ) : transitions.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              No hay transiciones disponibles para su rol en este estado.
            </div>
          ) : (
            transitions.map((transition) => {
              const Icon = ICON_MAP[transition.icon] || Send;
              const colorClass = COLOR_MAP[transition.color] || COLOR_MAP.sky;

              return (
                <button
                  key={transition.target_status}
                  onClick={() => openModal(transition)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${colorClass} whitespace-nowrap`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{transition.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Transition Modal */}
      {selectedTransition && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !submitting && setIsModalOpen(false)}
          title={selectedTransition.label}
          subtitle={`Transición de estado hacia "${selectedTransition.target_status}"`}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
            {globalError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Nota u Observación de Constancia {selectedTransition.min_note_length > 0 && '*'}
              </label>
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (fieldErrors.note) setFieldErrors((prev) => ({ ...prev, note: '' }));
                }}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[100px] resize-none focus:outline-none transition-all ${
                  fieldErrors.note ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-sky-500'
                }`}
                placeholder="Ingrese los detalles y fundamentación de esta acción policial..."
              />
              <div className="flex justify-between items-center mt-1">
                {fieldErrors.note ? (
                  <p className="text-xs text-red-400 font-medium">{fieldErrors.note}</p>
                ) : <span />}
                <span className={`text-[11px] font-mono ${note.length < selectedTransition.min_note_length ? 'text-amber-400' : 'text-slate-400'}`}>
                  {note.length} / {selectedTransition.min_note_length || 0} car. mín.
                </span>
              </div>
            </div>

            {selectedTransition.requires_destination && (
              <>
                <Select
                  label="Entidad de Destino *"
                  value={destinationEntity}
                  error={fieldErrors.destination_entity}
                  onChange={(e) => {
                    setDestinationEntity(e.target.value);
                    if (fieldErrors.destination_entity) setFieldErrors((prev) => ({ ...prev, destination_entity: '' }));
                  }}
                  options={[{ value: '', label: '-- Seleccione Entidad --' }, ...entities]}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    N° de Oficio / Documento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value);
                      if (fieldErrors.document_number) setFieldErrors((prev) => ({ ...prev, document_number: '' }));
                    }}
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
                      fieldErrors.document_number ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-sky-500'
                    }`}
                    placeholder="Ej. OFICIO-001-2026-DIRINCRI"
                  />
                  {fieldErrors.document_number && (
                    <p className="text-xs text-red-400 font-medium">{fieldErrors.document_number}</p>
                  )}
                </div>
              </>
            )}

            {selectedTransition.requires_evidence && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Fotografía de Evidencia / Acta de Intervención *
                </label>
                <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-colors ${
                  fieldErrors.files ? 'border-red-500 bg-red-950/20' : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}>
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-300 mb-3">Adjunte fotos o actas firmadas como sustento</p>
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
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-700"
                  >
                    Seleccionar Archivos
                  </label>
                </div>
                {fieldErrors.files && <p className="text-xs text-red-400 font-medium">{fieldErrors.files}</p>}

                {files.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                        <span className="text-slate-300 truncate mr-2">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting}>
                Confirmar Transición
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
