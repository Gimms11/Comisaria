import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { GuideItem } from '../../types';
import { guideResourceSchema, GuideResourceFormData } from '../../lib/validations';

interface GuideAttachResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: GuideItem | null;
  onSubmit: (guideId: string, data: GuideResourceFormData) => Promise<void>;
}

export const GuideAttachResourceModal: React.FC<GuideAttachResourceModalProps> = ({
  isOpen,
  onClose,
  guide,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GuideResourceFormData>({
    resolver: zodResolver(guideResourceSchema),
    defaultValues: {
      title: '',
      resource_type: 'enlace',
      external_url: '',
      body: '',
    },
  });

  const resourceType = watch('resource_type');

  const handleFormSubmit = async (data: GuideResourceFormData) => {
    if (!guide) return;
    await onSubmit(guide.id, data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adjuntar Recurso Descargable o Enlace"
      subtitle={`Asociar documento o web complementaria a: ${guide?.title || ''}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left" noValidate>
        <Input
          label="Nombre del Recurso"
          placeholder="Ej: Formulario F-02 Solicitud de Copia PNP (PDF)"
          error={errors.title?.message}
          {...register('title')}
        />

        <Select
          label="Tipo de Recurso"
          error={errors.resource_type?.message}
          {...register('resource_type')}
          options={[
            { value: 'enlace', label: 'Enlace Web Externo' },
            { value: 'imagen', label: 'Archivo / Documento Descargable' },
            { value: 'texto', label: 'Texto / Nota Explicativa Adicional' },
          ]}
        />

        {(resourceType === 'enlace' || resourceType === 'imagen') && (
          <Input
            label="URL de Destino / Documento"
            placeholder="https://..."
            error={errors.external_url?.message}
            {...register('external_url')}
          />
        )}

        {resourceType === 'texto' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Contenido del Texto / Nota
            </label>
            <textarea
              rows={3}
              placeholder="Instrucciones adicionales para el ciudadano..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              {...register('body')}
            />
          </div>
        )}

        <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
          Adjuntar a la Guía
        </Button>
      </form>
    </Modal>
  );
};
