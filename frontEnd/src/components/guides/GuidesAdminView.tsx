import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
} from 'lucide-react';
import { api } from '../../services/api';
import { GuideCategory, GuideItem } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { GuideAdminCard } from './GuideAdminCard';
import {
  guideCreateSchema,
  guideEditSchema,
  guideResourceSchema,
  formatZodErrors,
} from '../../lib/validations';

export const GuidesAdminView: React.FC = () => {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedGuideForResource, setSelectedGuideForResource] = useState<GuideItem | null>(null);

  // Form Errors
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [resourceErrors, setResourceErrors] = useState<Record<string, string>>({});

  // Forms
  const [newGuideForm, setNewGuideForm] = useState<{
    title: string;
    summary: string;
    category_id: string;
    content_type: 'video' | 'articulo' | 'infografia' | 'mixto';
    main_video_url: string;
    thumbnail_url: string;
    transcript: string;
    is_featured: boolean;
  }>({
    title: '',
    summary: '',
    category_id: '',
    content_type: 'video',
    main_video_url: '',
    thumbnail_url: '',
    transcript: '',
    is_featured: false,
  });

  const [resourceForm, setResourceForm] = useState<{
    title: string;
    resource_type: 'enlace' | 'imagen' | 'texto';
    external_url: string;
    media_url: string;
    body: string;
  }>({
    title: '',
    resource_type: 'enlace',
    external_url: '',
    media_url: '',
    body: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideItem | null>(null);
  const [editGuideForm, setEditGuideForm] = useState({
    title: '',
    summary: '',
    category_id: '',
    main_video_url: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingGuideId, setTogglingGuideId] = useState<string | null>(null);

  const fetchGuides = async () => {
    try {
      setIsLoading(true);
      const data = await api.listAdminGuides();
      setGuides(data);
    } catch (e) {
      console.warn('Error al cargar guías:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await api.listGuideCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al cargar categorías de guías:', e);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchGuides();
  }, []);

  const handleTogglePublish = async (guide: GuideItem) => {
    try {
      setTogglingGuideId(guide.id);
      await api.toggleGuidePublish(guide.id, !guide.is_published);
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar publicación');
    } finally {
      setTogglingGuideId(null);
    }
  };

  const handleDeleteGuide = async (guide: GuideItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar la guía "${guide.title}"?`)) return;
    try {
      await api.deleteGuide(guide.id);
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la guía');
    }
  };

  const handleOpenEdit = (guide: GuideItem) => {
    setEditingGuide(guide);
    setEditGuideForm({
      title: guide.title,
      summary: guide.summary,
      category_id: guide.category_id || '',
      main_video_url: guide.main_video_url || '',
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuide) return;
    setEditErrors({});

    const result = guideEditSchema.safeParse(editGuideForm);
    if (!result.success) {
      setEditErrors(formatZodErrors(result.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateGuide(editingGuide.id, {
        title: result.data.title,
        summary: result.data.summary,
        category_id: result.data.category_id || undefined,
        main_video_url: result.data.main_video_url || undefined,
      });
      setIsEditModalOpen(false);
      setEditingGuide(null);
      setEditErrors({});
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la guía');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrors({});

    const result = guideCreateSchema.safeParse(newGuideForm);
    if (!result.success) {
      setCreateErrors(formatZodErrors(result.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createGuide({
        ...result.data,
        category_id: result.data.category_id || undefined,
      });
      setIsCreateModalOpen(false);
      setNewGuideForm({
        title: '',
        summary: '',
        category_id: '',
        content_type: 'video',
        main_video_url: '',
        thumbnail_url: '',
        transcript: '',
        is_featured: false,
      });
      setCreateErrors({});
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al crear guía');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuideForResource) return;
    setResourceErrors({});

    const result = guideResourceSchema.safeParse(resourceForm);
    if (!result.success) {
      setResourceErrors(formatZodErrors(result.error));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.addGuideResource(selectedGuideForResource.id, result.data);
      setIsResourceModalOpen(false);
      setResourceForm({
        title: '',
        resource_type: 'enlace',
        external_url: '',
        media_url: '',
        body: '',
      });
      setResourceErrors({});
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al adjuntar recurso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-sky-400" />
            Gestor de Guías Cívicas & Micro-Videos (MS-04)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Producción editorial de contenido ciudadano, trámites de comisaría en video vertical y recursos descargables.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setCreateErrors({});
            setIsCreateModalOpen(true);
          }}
          className="gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" /> Crear Guía
        </Button>
      </div>

      {/* Grid of Video Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Cargando biblioteca de guías cívicas...
          </div>
        ) : guides.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No se han registrado guías cívicas aún.
          </div>
        ) : (
          guides.map((guide) => (
            <GuideAdminCard
              key={guide.id}
              guide={guide}
              isToggling={togglingGuideId === guide.id}
              onTogglePublish={handleTogglePublish}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteGuide}
              onAttachResource={(selected) => {
                setSelectedGuideForResource(selected);
                setResourceErrors({});
                setIsResourceModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* Edit Guide Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGuide(null);
          setEditErrors({});
        }}
        title={`Editar Guía: ${editingGuide?.title || ''}`}
        subtitle="Actualiza el contenido, categoría o enlace de video de la guía"
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateGuide} className="space-y-4 text-left" noValidate>
          <Input
            label="Título de la Guía"
            placeholder="Ej: Cómo denunciar pérdida de DNI por internet"
            value={editGuideForm.title}
            error={editErrors.title}
            onChange={(e) => {
              setEditGuideForm((prev) => ({ ...prev, title: e.target.value }));
              if (editErrors.title) setEditErrors((prev) => ({ ...prev, title: '' }));
            }}
          />

          <Select
            label="Categoría"
            value={editGuideForm.category_id}
            error={editErrors.category_id}
            onChange={(e) => {
              setEditGuideForm((prev) => ({ ...prev, category_id: e.target.value }));
              if (editErrors.category_id) setEditErrors((prev) => ({ ...prev, category_id: '' }));
            }}
            options={[
              { value: '', label: 'Sin categoría' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Input
            label="URL del Video de TikTok (dejar igual o pegar uno nuevo)"
            placeholder="https://www.tiktok.com/@comisaria/video/..."
            value={editGuideForm.main_video_url}
            error={editErrors.main_video_url}
            onChange={(e) => {
              setEditGuideForm((prev) => ({ ...prev, main_video_url: e.target.value }));
              if (editErrors.main_video_url) setEditErrors((prev) => ({ ...prev, main_video_url: '' }));
            }}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Resumen / Pasos Clave (Markdown)
            </label>
            <textarea
              rows={3}
              placeholder="1. Ingrese a la plataforma... 2. Siga los pasos..."
              value={editGuideForm.summary}
              onChange={(e) => {
                setEditGuideForm((prev) => ({ ...prev, summary: e.target.value }));
                if (editErrors.summary) setEditErrors((prev) => ({ ...prev, summary: '' }));
              }}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
                editErrors.summary ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-sky-500'
              }`}
            />
            {editErrors.summary && <p className="text-xs text-red-400 font-medium">{editErrors.summary}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="w-full"
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Guardando cambios...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Modal>

      {/* Create Guide Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateErrors({});
        }}
        title="Crear Nueva Guía Cívica"
        subtitle="Publicación de tutoriales, requisitos y trámites para la ciudadanía"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateGuide} className="space-y-4 text-left" noValidate>
          <Input
            label="Título de la Guía"
            placeholder="Ej: Cómo denunciar pérdida de DNI por internet"
            value={newGuideForm.title}
            error={createErrors.title}
            onChange={(e) => {
              setNewGuideForm((prev) => ({ ...prev, title: e.target.value }));
              if (createErrors.title) setCreateErrors((prev) => ({ ...prev, title: '' }));
            }}
          />

          <Select
            label="Categoría"
            value={newGuideForm.category_id}
            error={createErrors.category_id}
            onChange={(e) => {
              setNewGuideForm((prev) => ({ ...prev, category_id: e.target.value }));
              if (createErrors.category_id) setCreateErrors((prev) => ({ ...prev, category_id: '' }));
            }}
            options={[
              { value: '', label: 'Seleccione una categoría' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Input
            label="URL del Video de TikTok"
            placeholder="https://www.tiktok.com/@comisaria/video/... o https://vm.tiktok.com/..."
            value={newGuideForm.main_video_url}
            error={createErrors.main_video_url}
            onChange={(e) => {
              setNewGuideForm((prev) => ({ ...prev, main_video_url: e.target.value }));
              if (createErrors.main_video_url) setCreateErrors((prev) => ({ ...prev, main_video_url: '' }));
            }}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Resumen / Pasos Clave (Markdown)
            </label>
            <textarea
              rows={3}
              placeholder="1. Ingrese a la plataforma de la PNP&#10;2. Adjunte su número de DNI&#10;3. Descargue el certificado oficial..."
              value={newGuideForm.summary}
              onChange={(e) => {
                setNewGuideForm((prev) => ({ ...prev, summary: e.target.value }));
                if (createErrors.summary) setCreateErrors((prev) => ({ ...prev, summary: '' }));
              }}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all ${
                createErrors.summary ? 'border-red-500 focus:border-red-500' : 'border-slate-700/80 focus:border-sky-500'
              }`}
            />
            {createErrors.summary && <p className="text-xs text-red-400 font-medium">{createErrors.summary}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="w-full"
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? newGuideForm.main_video_url
                ? 'Descargando TikTok y creando guía...'
                : 'Guardando guía...'
              : 'Registrar Guía en Borrador'}
          </Button>
        </form>
      </Modal>

      {/* Attach Resource Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setResourceErrors({});
        }}
        title={
          selectedGuideForResource
            ? `Adjuntar Recurso: ${selectedGuideForResource.title}`
            : 'Adjuntar Recurso'
        }
        subtitle="Agregue formatos oficiales PDF descargables o enlaces de derivación"
        maxWidth="lg"
      >
        <form onSubmit={handleAddResource} className="space-y-4 text-left" noValidate>
          <Input
            label="Nombre del Recurso"
            placeholder="Ej: Formato de Solicitud de Constancia PDF"
            value={resourceForm.title}
            error={resourceErrors.title}
            onChange={(e) => {
              setResourceForm((prev) => ({ ...prev, title: e.target.value }));
              if (resourceErrors.title) setResourceErrors((prev) => ({ ...prev, title: '' }));
            }}
          />

          <Select
            label="Tipo de Recurso"
            value={resourceForm.resource_type}
            error={resourceErrors.resource_type}
            onChange={(e) => {
              setResourceForm((prev) => ({ ...prev, resource_type: e.target.value as 'enlace' | 'imagen' | 'texto' }));
              if (resourceErrors.resource_type) setResourceErrors((prev) => ({ ...prev, resource_type: '' }));
            }}
            options={[
              { value: 'enlace', label: 'Enlace Web Oficial (ej: Reclamaciones Gob.pe)' },
              { value: 'imagen', label: 'Infografía / Diagrama de Pasos' },
              { value: 'texto', label: 'Instrucciones en Texto' },
            ]}
          />

          <Input
            label="URL Externa o Enlace de Descarga"
            placeholder="https://www.gob.pe/pnp/..."
            value={resourceForm.external_url}
            error={resourceErrors.external_url}
            onChange={(e) => {
              setResourceForm((prev) => ({ ...prev, external_url: e.target.value }));
              if (resourceErrors.external_url) setResourceErrors((prev) => ({ ...prev, external_url: '' }));
            }}
          />

          <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
            Guardar Recurso
          </Button>
        </form>
      </Modal>
    </div>
  );
};
