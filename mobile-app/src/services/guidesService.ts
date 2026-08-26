import { API_CONFIG } from '@/config/api.config';
import { apiFetch } from './apiClient';
import { GuideCategory, GuideItem } from '@/types';

export const SEED_GUIDE_CATEGORIES: GuideCategory[] = [
  { id: 'g1000000-0000-0000-0000-000000000001', name: 'Todas', slug: 'todas', icon_name: 'sparkles', sort_order: 0 },
  { id: 'g1000000-0000-0000-0000-000000000002', name: 'Guías rápidas', slug: 'guias-rapidas', icon_name: 'zap', sort_order: 1 },
  { id: 'g1000000-0000-0000-0000-000000000003', name: 'Seguridad', slug: 'seguridad-ciudadana', icon_name: 'shield', sort_order: 2 },
  { id: 'g1000000-0000-0000-0000-000000000004', name: 'Violencia familiar', slug: 'violencia-familiar', icon_name: 'heart', sort_order: 3 },
  { id: 'g1000000-0000-0000-0000-000000000005', name: 'Extorsión y llamadas', slug: 'extorsion-llamadas', icon_name: 'phone-off', sort_order: 4 },
  { id: 'g1000000-0000-0000-0000-000000000006', name: 'Trámites y DNI', slug: 'tramites-documentos', icon_name: 'file-text', sort_order: 5 },
];

export const SEED_GUIDES: GuideItem[] = [
  {
    id: 'g0000000-0000-0000-0000-000000000001',
    title: '¿Cómo hacer una denuncia anónima segura?',
    slug: 'denuncia-anonima-segura',
    summary: 'Aprende cómo reportar un hecho delictivo sin exponer tu identidad ni comprometer tu seguridad.',
    content_type: 'video',
    main_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 45,
    is_featured: true,
    category: {
      id: 'g1000000-0000-0000-0000-000000000002',
      name: 'Guías rápidas',
      slug: 'guias-rapidas',
      icon_name: 'zap',
    },
    view_count: 1420,
    helpful_count: 384,
    steps_count: 4,
    steps: [
      {
        step_number: 1,
        title: 'Accede sin crear cuenta',
        instruction: 'La app no te solicitará DNI, nombres ni ningún dato que comprometa tu identidad.',
        icon_name: 'user-x',
      },
      {
        step_number: 2,
        title: 'Elige el tipo de delito y describe el hecho',
        instruction: 'Indica detalles precisos como hora aproximada, vestimenta o vehículos involucrados.',
        icon_name: 'file-text',
      },
      {
        step_number: 3,
        title: 'Fija el lugar en el mapa o referencia',
        instruction: 'La app elimina automáticamente la geolocalización oculta de tus archivos de evidencia.',
        icon_name: 'map-pin',
      },
      {
        step_number: 4,
        title: 'Guarda tu código y crea tu PIN de 6 dígitos',
        instruction: 'Usa tu código LT-2026-XXXXXX para ver el avance policial desde cualquier dispositivo.',
        icon_name: 'key',
      },
    ],
  },
  {
    id: 'g0000000-0000-0000-0000-000000000002',
    title: 'Qué hacer ante llamadas extorsivas o "Gota a Gota"',
    slug: 'llamada-extorsion',
    summary: 'Protocolo inmediato de seguridad y protección familiar ante amenazas telefónicas.',
    content_type: 'video',
    main_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 60,
    is_featured: true,
    category: {
      id: 'g1000000-0000-0000-0000-000000000005',
      name: 'Extorsión y llamadas',
      slug: 'extorsion-llamadas',
      icon_name: 'phone-off',
    },
    view_count: 2890,
    helpful_count: 915,
    steps_count: 4,
    steps: [
      {
        step_number: 1,
        title: 'Mantén la calma y no confrontes',
        instruction: 'Escucha sin comprometerte ni brindar nombres de familiares ni información bancaria.',
        icon_name: 'volume-x',
      },
      {
        step_number: 2,
        title: 'Graba la llamada o toma captura de mensajes',
        instruction: 'Guarda los números de teléfono, audios de WhatsApp y números de cuenta exigidos.',
        icon_name: 'smartphone',
      },
      {
        step_number: 3,
        title: 'No realices ningún depósito ni pago',
        instruction: 'El pago incrementa la frecuencia de las amenazas. Notifica a tu círculo cercano.',
        icon_name: 'dollar-sign',
      },
      {
        step_number: 4,
        title: 'Registra la denuncia anónima inmediata en la app',
        instruction: 'El área de investigación criminal recibirá la alerta para coordinar acciones de campo.',
        icon_name: 'shield-alert',
      },
    ],
  },
  {
    id: 'g0000000-0000-0000-0000-000000000003',
    title: 'Ruta de protección en Violencia Familiar (Línea 100 y PNP)',
    slug: 'violencia-familiar-ruta',
    summary: 'Conoce los canales de auxilio urgente, medidas de protección inmediatas y refugios.',
    content_type: 'video',
    main_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 50,
    is_featured: true,
    category: {
      id: 'g1000000-0000-0000-0000-000000000004',
      name: 'Violencia familiar',
      slug: 'violencia-familiar',
      icon_name: 'heart',
    },
    view_count: 3105,
    helpful_count: 1240,
    steps_count: 3,
    steps: [
      {
        step_number: 1,
        title: 'Llama al 105 o Línea 100 de inmediato',
        instruction: 'La atención de emergencia policial tiene prioridad absoluta ante agresiones en flagrancia.',
        icon_name: 'phone-call',
      },
      {
        step_number: 2,
        title: 'Solicita medidas de protección judicial',
        instruction: 'El juzgado de familia emite orden de alejamiento y retiro del agresor en menos de 24h.',
        icon_name: 'file-check',
      },
      {
        step_number: 3,
        title: 'Acude al CEM (Centro Emergencia Mujer)',
        instruction: 'Asesoría legal y psicológica 100% gratuita y confidencial en el distrito.',
        icon_name: 'users',
      },
    ],
  },
  {
    id: 'g0000000-0000-0000-0000-000000000004',
    title: 'Trámite digital por pérdida o robo de DNI',
    slug: 'tramite-perdida-dni',
    summary: 'Constancia policial digital válida ante RENIEC y entidades bancarias.',
    content_type: 'video',
    main_video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    duration_seconds: 35,
    is_featured: false,
    category: {
      id: 'g1000000-0000-0000-0000-000000000006',
      name: 'Trámites y DNI',
      slug: 'tramites-documentos',
      icon_name: 'file-text',
    },
    view_count: 980,
    helpful_count: 412,
    steps_count: 3,
    steps: [
      {
        step_number: 1,
        title: 'Genera tu constancia de pérdida',
        instruction: 'Ingresa a la plataforma digital policial o usa la opción de reporte en la comisaría.',
        icon_name: 'globe',
      },
      {
        step_number: 2,
        title: 'Realiza el pago de duplicado en Pagalo.pe',
        instruction: 'Código de tasa tributaria RENIEC para duplicado de DNI electrónico o azul.',
        icon_name: 'credit-card',
      },
      {
        step_number: 3,
        title: 'Recoge tu documento en la agencia RENIEC',
        instruction: 'Monitorea el estado del trámite en línea hasta la entrega.',
        icon_name: 'check-circle',
      },
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
      return SEED_GUIDE_CATEGORIES;
    } catch (e) {
      console.warn('Usando categorías locales de guías:', e);
      return SEED_GUIDE_CATEGORIES;
    }
  },

  async listGuides(categoryId?: string, search?: string): Promise<GuideItem[]> {
    try {
      const url = new URL(`${API_CONFIG.GUIDES_BASE_URL}/guides/`);
      if (categoryId && categoryId !== 'all') {
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
      return this.filterSeedGuides(categoryId, search);
    } catch (e) {
      console.warn('Usando guías locales mock:', e);
      return this.filterSeedGuides(categoryId, search);
    }
  },

  filterSeedGuides(categoryId?: string, search?: string): GuideItem[] {
    let result = [...SEED_GUIDES];
    if (categoryId && categoryId !== 'all' && categoryId !== 'todas') {
      result = result.filter(
        (g) =>
          g.category?.id === categoryId ||
          g.category?.slug === categoryId ||
          g.category_id === categoryId
      );
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.summary.toLowerCase().includes(q) ||
          (g.category?.name && g.category.name.toLowerCase().includes(q)) ||
          (g.category_name && g.category_name.toLowerCase().includes(q))
      );
    }
    return result;
  },

  async getGuideDetail(slugOrId: string): Promise<GuideItem> {
    try {
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
    } catch (e) {
      const found = SEED_GUIDES.find(
        (g) => g.id === slugOrId || g.slug === slugOrId
      );
      if (found) return found;
      throw e;
    }
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
