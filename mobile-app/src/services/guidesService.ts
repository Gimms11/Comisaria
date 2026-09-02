import { API_CONFIG } from '@/config/api.config';
import { apiFetch } from './apiClient';
import { GuideCategory, GuideItem } from '@/types';

const DEFAULT_GUIDE_CATEGORIES: GuideCategory[] = [
  { id: 'all', name: 'Todas', slug: 'todas', icon_name: 'sparkles', sort_order: 0 },
  { id: 'cat-gui-01', name: 'Denuncias y Seguridad', slug: 'denuncias', icon_name: 'shield', sort_order: 1 },
  { id: 'cat-gui-02', name: 'Pérdida de Documentos', slug: 'documentos', icon_name: 'file-text', sort_order: 2 },
  { id: 'cat-gui-03', name: 'Prevención de Estafas', slug: 'estafas', icon_name: 'alert-triangle', sort_order: 3 },
  { id: 'cat-gui-04', name: 'Violencia Familiar', slug: 'violencia', icon_name: 'heart', sort_order: 4 },
];

const DEFAULT_GUIDES: GuideItem[] = [
  {
    id: 'g-01',
    title: '¿Cómo denunciar extorsiones o cobros ilegales?',
    slug: 'denunciar-extorsion',
    summary: 'Pasos para preservar mensajes, audios y registrar la denuncia sin exponer tu identidad.',
    content_type: 'video',
    duration_seconds: 45,
    is_featured: true,
    category: {
      id: 'cat-gui-01',
      name: 'Denuncias y Seguridad',
      slug: 'denuncias',
      icon_name: 'shield',
    },
    view_count: 120,
    helpful_count: 85,
    steps: [
      { step_number: 1, title: 'No borres chats ni audios', instruction: 'Toma capturas de pantalla con fecha y hora visibles.' },
      { step_number: 2, title: 'No deposites dinero', instruction: 'Informa a la comisaría antes de realizar cualquier transferencia.' },
      { step_number: 3, title: 'Usa la app de La Tinguiña', instruction: 'Envía tu denuncia anónima con la foto o captura adjunta.' },
    ],
  },
  {
    id: 'g-02',
    title: 'Trámite digital por pérdida de DNI o celular',
    slug: 'perdida-dni-celular',
    summary: 'Cómo tramitar tu certificado digital de pérdida policial sin hacer filas.',
    content_type: 'video',
    duration_seconds: 35,
    is_featured: true,
    category: {
      id: 'cat-gui-02',
      name: 'Pérdida de Documentos',
      slug: 'documentos',
      icon_name: 'file-text',
    },
    view_count: 240,
    helpful_count: 150,
    steps: [
      { step_number: 1, title: 'Bloquea tu línea', instruction: 'Llama de inmediato a tu operador móvil para bloquear el chip y equipo (IMEI).' },
      { step_number: 2, title: 'Genera constancia policial', instruction: 'Ingresa a la plataforma digital PNP o acude a la comisaría.' },
    ],
  },
];

export const GuidesService = {
  async getCategories(): Promise<GuideCategory[]> {
    try {
      const data = await apiFetch<GuideCategory[]>(
        `${API_CONFIG.GUIDES_BASE_URL}/guide-categories/`
      );
      if (Array.isArray(data) && data.length > 0) {
        return [{ id: 'all', name: 'Todas', slug: 'todas', icon_name: 'sparkles', sort_order: 0 }, ...data];
      }
      return DEFAULT_GUIDE_CATEGORIES;
    } catch {
      return DEFAULT_GUIDE_CATEGORIES;
    }
  },

  async listGuides(categoryId?: string, search?: string): Promise<GuideItem[]> {
    try {
      const url = new URL(`${API_CONFIG.GUIDES_BASE_URL}/guides/`);
      if (categoryId && categoryId !== 'all' && categoryId !== 'todas') {
        url.searchParams.append('category_id', categoryId);
      }
      if (search && search.trim()) {
        url.searchParams.append('search', search.trim());
      }

      const data = await apiFetch<any[]>(url.toString());
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          ...item,
          category: item.category || {
            id: item.category_id || '',
            name: item.category_name || 'Guía Cívica',
            slug: '',
            icon_name: 'shield',
          },
        }));
      }
    } catch {
      // Fallback below
    }

    // Apply local filter on default guides if backend is unavailable
    return DEFAULT_GUIDES.filter((g) => {
      if (categoryId && categoryId !== 'all' && categoryId !== 'todas') {
        const matchId = g.category?.id === categoryId;
        const matchSlug = g.category?.slug === categoryId;
        if (!matchId && !matchSlug) return false;
      }
      if (search && search.trim()) {
        const q = search.toLowerCase();
        return g.title.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q);
      }
      return true;
    });
  },

  async getGuideDetail(slugOrId: string): Promise<GuideItem> {
    const data = await apiFetch<any>(
      `${API_CONFIG.GUIDES_BASE_URL}/guides/${encodeURIComponent(slugOrId)}`
    );
    if (data) {
      return {
        ...data,
        category: data.category || {
          id: data.category_id || '',
          name: data.category_name || 'Guía Cívica',
          slug: '',
          icon_name: 'shield',
        },
      };
    }
    throw new Error('Guía no encontrada');
  },

  async trackInteraction(guideId: string, eventType: 'view' | 'helpful'): Promise<void> {
    try {
      await apiFetch(`${API_CONFIG.GUIDES_BASE_URL}/guides/${guideId}/track`, {
        method: 'POST',
        body: JSON.stringify({ event_type: eventType }),
      });
    } catch (e) {
      console.warn('Track interaction warning:', e);
    }
  },
};
