import { API_CONFIG } from '@/config/api.config';
import { apiFetch } from './apiClient';
import { GuideCategory, GuideItem } from '@/types';
import { logger } from '@/utils/logger';

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
    thumbnail_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    main_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    thumbnail_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800',
    main_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
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
        logger.info('GUIDES', `Categorías cargadas desde el servidor (${data.length})`);
        return [{ id: 'all', name: 'Todas', slug: 'todas', icon_name: 'sparkles', sort_order: 0 }, ...data];
      }
      return DEFAULT_GUIDE_CATEGORIES;
    } catch (e: any) {
      logger.warn('GUIDES', `Usando categorías por defecto: ${e?.message || e}`);
      return DEFAULT_GUIDE_CATEGORIES;
    }
  },

  async listGuides(categoryId?: string, search?: string): Promise<GuideItem[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== 'all' && categoryId !== 'todas') {
        params.append('category_id', categoryId);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      const qs = params.toString();
      const endpoint = `${API_CONFIG.GUIDES_BASE_URL}/guides/${qs ? `?${qs}` : ''}`;

      const data = await apiFetch<any[]>(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        logger.info('GUIDES', `Guías cívicas cargadas desde el servidor (${data.length})`);
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
      logger.info('GUIDES', 'El servidor no tiene guías registradas. Usando catálogo preventivo local.');
    } catch (e: any) {
      logger.warn('GUIDES', `Error al obtener guías de red, activando catálogo offline: ${e?.message || e}`);
    }

    // Apply local filter on default guides if backend is unavailable or empty
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
