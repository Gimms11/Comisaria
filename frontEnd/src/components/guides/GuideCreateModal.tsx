import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { GuideCategory } from '../../types';
import { guideCreateSchema, GuideCreateFormData } from '../../lib/validations';

interface GuideCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: GuideCategory[];
  onSubmit: (data: GuideCreateFormData) => Promise<void>;
}

export const GuideCreateModal: React.FC<GuideCreateModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GuideCreateFormData>({
    resolver: zodResolver(guideCreateSchema),
    defaultValues: {
      title: '',
      summary: '',
      category_id: '',
      content_type: 'video',
      main_video_url: '',
      thumbnail_url: '',
      transcript: '',
      is_featured: false,
    },
  });

  const handleFormSubmit = async (data: GuideCreateFormData) => {
    await onSubmit(data);
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
      title="Crear Nueva Guía Cívica Ciudadana"
      subtitle="Publica contenido audiovisual o paso a paso para la ciudadanía"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left" noValidate>
        <Input
          label="Título de la Guía"
          placeholder="Ej: Trámite de Copia Certificada de Denuncia"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoría"
            error={errors.category_id?.message}
            {...register('category_id')}
            options={[
              { value: '', label: 'Sin categoría' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            label="Tipo de Contenido"
            error={errors.content_type?.message}
            {...register('content_type')}
            options={[
              { value: 'video', label: 'Micro-Video Vertical (Reel/TikTok)' },
              { value: 'articulo', label: 'Artículo de Texto' },
              { value: 'infografia', label: 'Infografía / Imagen' },
              { value: 'mixto', label: 'Contenido Multimedia Mixto' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            Resumen o Pasos Clave
          </label>
          <textarea
            rows={3}
            placeholder="Explique concisamente de qué trata la guía..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            {...register('summary')}
          />
          {errors.summary?.message && (
            <p className="text-xs text-red-400 mt-1">{errors.summary.message}</p>
          )}
        </div>

        <Input
          label="URL del Video (TikTok, YouTube Shorts, MP4)"
          placeholder="https://..."
          error={errors.main_video_url?.message}
          {...register('main_video_url')}
        />

        <Input
          label="URL de Imagen de Portada (Thumbnail)"
          placeholder="https://..."
          error={errors.thumbnail_url?.message}
          {...register('thumbnail_url')}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            Transcripción del Audio / Guión
          </label>
          <textarea
            rows={2}
            placeholder="Texto para accesibilidad de audio..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            {...register('transcript')}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="create_is_featured"
            className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900"
            {...register('is_featured')}
          />
          <label htmlFor="create_is_featured" className="text-xs text-slate-300 cursor-pointer select-none">
            Destacar en la portada principal ciudadana
          </label>
        </div>

        <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
          Guardar Guía Cívica
        </Button>
      </form>
    </Modal>
  );
};
