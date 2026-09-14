import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { GuideCategory, GuideItem } from '../../types';
import { Button } from '../ui/Button';
import { GuideAdminCard } from './GuideAdminCard';
import { GuideCreateModal } from './GuideCreateModal';
import { GuideEditModal } from './GuideEditModal';
import { GuideAttachResourceModal } from './GuideAttachResourceModal';
import { GuideCreateFormData, GuideEditFormData, GuideResourceFormData } from '../../lib/validations';

export const GuidesAdminView: React.FC = () => {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  const [editingGuide, setEditingGuide] = useState<GuideItem | null>(null);
  const [selectedGuideForResource, setSelectedGuideForResource] = useState<GuideItem | null>(null);
  const [togglingGuideId, setTogglingGuideId] = useState<string | null>(null);

  const fetchGuides = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.listAdminGuides();
      setGuides(data);
    } catch (e) {
      console.warn('Error al cargar guías:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.listGuideCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Error al cargar categorías de guías:', e);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchGuides();
  }, [fetchCategories, fetchGuides]);

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
    setIsEditModalOpen(true);
  };

  const handleCreateGuide = async (data: GuideCreateFormData) => {
    try {
      await api.createGuide({
        ...data,
        category_id: data.category_id || undefined,
      });
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al crear guía');
      throw err;
    }
  };

  const handleUpdateGuide = async (id: string, data: GuideEditFormData) => {
    try {
      await api.updateGuide(id, {
        title: data.title,
        summary: data.summary,
        category_id: data.category_id || undefined,
        main_video_url: data.main_video_url || undefined,
      });
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la guía');
      throw err;
    }
  };

  const handleAddResource = async (guideId: string, data: GuideResourceFormData) => {
    try {
      await api.addGuideResource(guideId, data);
      await fetchGuides();
    } catch (err: any) {
      alert(err.message || 'Error al adjuntar recurso');
      throw err;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0 flex items-center justify-center">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400 shrink-0" />
            </div>
            <span>Guías Cívicas & Micro-Videos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Producción editorial cívica, trámites institucionales y recursos comunitarios.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" /> Crear Guía
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
                setIsResourceModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* Create Guide Modal */}
      <GuideCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories}
        onSubmit={handleCreateGuide}
      />

      {/* Edit Guide Modal */}
      <GuideEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGuide(null);
        }}
        guide={editingGuide}
        categories={categories}
        onSubmit={handleUpdateGuide}
      />

      {/* Attach Resource Modal */}
      <GuideAttachResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false);
          setSelectedGuideForResource(null);
        }}
        guide={selectedGuideForResource}
        onSubmit={handleAddResource}
      />
    </div>
  );
};
