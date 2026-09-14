import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { GuideCategory, GuideItem } from '../../types';
import { guideEditSchema, GuideEditFormData } from '../../lib/validations';

interface GuideEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: GuideItem | null;
  categories: GuideCategory[];
  onSubmit: (id: string, data: GuideEditFormData) => Promise<void>;
}

export const GuideEditModal: React.FC<GuideEditModalProps> = ({
  isOpen,
  onClose,
  guide,
  categories,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GuideEditFormData>({
    resolver: zodResolver(guideEditSchema),
    defaultValues: {
      title: '',
      summary: '',
      category_id: '',
      main_video_url: '',
    },
  });

  useEffect(() => {
    if (guide) {
      reset({
        title: guide.title,
        summary: guide.summary,
        category_id: guide.category_id || '',
        main_video_url: guide.main_video_url || '',
      });
    }
  }, [guide, reset]);

  const handleFormSubmit = async (data: GuideEditFormData) => {
    if (!guide) return;
    await onSubmit(guide.id, data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Guía: ${guide?.title || ''}`}
      subtitle="Actualiza el contenido, categoría o enlace de video de la guía"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left" noValidate>
        <Input
          label="Título de la Guía"
          placeholder="Ej: Cómo denunciar pérdida de DNI por internet"
          error={errors.title?.message}
          {...register('title')}
        />

        <Select
          label="Categoría"
          error={errors.category_id?.message}
          {...register('category_id')}
          options={[
            { value: '', label: 'Sin categoría' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            Resumen o Pasos Clave
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            {...register('summary')}
          />
          {errors.summary?.message && (
            <p className="text-xs text-red-400 mt-1">{errors.summary.message}</p>
          )}
        </div>

        <Input
          label="URL del Video Vertical"
          placeholder="https://..."
          error={errors.main_video_url?.message}
          {...register('main_video_url')}
        />

        <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
          Guardar Cambios
        </Button>
      </form>
    </Modal>
  );
};
