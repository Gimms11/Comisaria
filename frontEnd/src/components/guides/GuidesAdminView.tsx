import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Video,
  Eye,
  ThumbsUp,
  Globe,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { GuideCategory, GuideItem } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { formatTimeAgo } from '../../lib/utils';

export const GuidesAdminView: React.FC = () => {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedGuideForResource, setSelectedGuideForResource] = useState<GuideItem | null>(null);

  // Forms
  const [newGuideForm, setNewGuideForm] = useState({
    title: '',
    summary: '',
    category_id: '',
    content_type: 'video',
    main_video_url: '',
    thumbnail_url: '',
    duration_seconds: 45,
    transcript: '',
    is_featured: false,
  });

  const [resourceForm, setResourceForm] = useState({
    title: '',
    resource_type: 'enlace',
    external_url: '',
    media_url: '',
    body: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await api.toggleGuidePublish(guide.id, !guide.is_published);
      fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar publicación');
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.createGuide({
        ...newGuideForm,
        category_id: newGuideForm.category_id || undefined,
      });
      setIsCreateModalOpen(false);
      setNewGuideForm({
        title: '',
        summary: '',
        category_id: '',
        content_type: 'video',
        main_video_url: '',
        thumbnail_url: '',
        duration_seconds: 45,
        transcript: '',
        is_featured: false,
      });
      fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al crear guía');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuideForResource) return;

    try {
      setIsSubmitting(true);
      await api.addGuideResource(selectedGuideForResource.id, resourceForm);
      setIsResourceModalOpen(false);
      setResourceForm({
        title: '',
        resource_type: 'enlace',
        external_url: '',
        media_url: '',
        body: '',
      });
      fetchGuides();
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
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
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
            <Card
              key={guide.id}
              className="bg-slate-900/90 border-slate-800 flex flex-col justify-between overflow-hidden p-0 group"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                {guide.thumbnail_url ? (
                  <img
                    src={guide.thumbnail_url}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Video className="w-10 h-10" />
                    <span className="text-xs font-mono">Formato Vertical 9:16</span>
                  </div>
                )}

                {/* Duration Badge */}
                {guide.duration_seconds && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {guide.duration_seconds}s
                  </span>
                )}

                {/* Published Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant={guide.is_published ? 'success' : 'warning'}>
                    {guide.is_published ? 'Publicado en App' : 'Borrador'}
                  </Badge>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                    {guide.category_name || 'Trámites PNP'}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight mt-1 line-clamp-2">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{guide.summary}</p>
                </div>

                {/* Analytics Counters */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-sky-400" /> {guide.view_count} vistas
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {guide.helpful_count} útiles
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant={guide.is_published ? 'outline' : 'success'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleTogglePublish(guide)}
                  >
                    {guide.is_published ? 'Ocultar' : 'Publicar'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setSelectedGuideForResource(guide);
                      setIsResourceModalOpen(true);
                    }}
                    title="Adjuntar PDF o Enlace Oficial"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Guide Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Guía Cívica"
        subtitle="Publicación de tutoriales, requisitos y trámites para la ciudadanía"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateGuide} className="space-y-4 text-left">
          <Input
            label="Título de la Guía"
            required
            placeholder="Ej: Cómo denunciar pérdida de DNI por internet"
            value={newGuideForm.title}
            onChange={(e) => setNewGuideForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoría"
              value={newGuideForm.category_id}
              onChange={(e) =>
                setNewGuideForm((prev) => ({ ...prev, category_id: e.target.value }))
              }
              options={[
                { value: '', label: 'Seleccione una categoría' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Input
              label="Duración del Video (segundos)"
              type="number"
              value={newGuideForm.duration_seconds}
              onChange={(e) =>
                setNewGuideForm((prev) => ({
                  ...prev,
                  duration_seconds: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          <Input
            label="URL del Video (MP4 / WebM / Cloud Storage)"
            placeholder="https://storage.googleapis.com/.../video.mp4"
            value={newGuideForm.main_video_url}
            onChange={(e) =>
              setNewGuideForm((prev) => ({ ...prev, main_video_url: e.target.value }))
            }
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Resumen / Pasos Clave (Markdown)
            </label>
            <textarea
              rows={3}
              required
              placeholder="1. Ingrese a la plataforma de la PNP&#10;2. Adjunte su número de DNI&#10;3. Descargue el certificado oficial..."
              value={newGuideForm.summary}
              onChange={(e) =>
                setNewGuideForm((prev) => ({ ...prev, summary: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
            Registrar Guía en Borrador
          </Button>
        </form>
      </Modal>

      {/* Attach Resource Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title={
          selectedGuideForResource
            ? `Adjuntar Recurso: ${selectedGuideForResource.title}`
            : 'Adjuntar Recurso'
        }
        subtitle="Agregue formatos oficiales PDF descargables o enlaces de derivación"
        maxWidth="lg"
      >
        <form onSubmit={handleAddResource} className="space-y-4 text-left">
          <Input
            label="Nombre del Recurso"
            required
            placeholder="Ej: Formato de Solicitud de Constancia PDF"
            value={resourceForm.title}
            onChange={(e) => setResourceForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Select
            label="Tipo de Recurso"
            value={resourceForm.resource_type}
            onChange={(e) =>
              setResourceForm((prev) => ({ ...prev, resource_type: e.target.value }))
            }
            options={[
              { value: 'enlace', label: 'Enlace Web Oficial (ej: Reclamaciones Gob.pe)' },
              { value: 'imagen', label: 'Infografía / Diagrama de Pasos' },
              { value: 'texto', label: 'Instrucciones en Texto' },
            ]}
          />

          <Input
            label="URL Externa o Archivo"
            placeholder="https://www.gob.pe/pnp/..."
            value={resourceForm.external_url}
            onChange={(e) =>
              setResourceForm((prev) => ({ ...prev, external_url: e.target.value }))
            }
          />

          <Button type="submit" variant="primary" size="sm" className="w-full" isLoading={isSubmitting}>
            Guardar Recurso
          </Button>
        </form>
      </Modal>
    </div>
  );
};
