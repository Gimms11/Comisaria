import { Platform } from 'react-native';
import { API_CONFIG } from '@/config/api.config';
import { apiFetch } from './apiClient';
import {
  Category,
  CommunityReportItem,
  CreateCommunityReportPayload,
  PublicReportCreatedResponse,
} from '@/types';

export const SEED_COMMUNITY_CATEGORIES: Category[] = [
  {
    id: 'u1000000-0000-0000-0000-000000000001',
    name: 'Bache o pista dañada',
    slug: 'bache-pista-danada',
    icon_name: 'road',
    applicable_type: 'reporte_comunitario',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000002',
    name: 'Alumbrado público apagado/dañado',
    slug: 'alumbrado-publico',
    icon_name: 'lightbulb',
    applicable_type: 'reporte_comunitario',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000003',
    name: 'Basura acumulada o desmonte',
    slug: 'basura-acumulada',
    icon_name: 'trash-2',
    applicable_type: 'reporte_comunitario',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000004',
    name: 'Poste en peligro de caída',
    slug: 'poste-mal-estado',
    icon_name: 'zap',
    applicable_type: 'reporte_comunitario',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000005',
    name: 'Señalización vial destruida',
    slug: 'senalizacion-danada',
    icon_name: 'octagon',
    applicable_type: 'reporte_comunitario',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'u1000000-0000-0000-0000-000000000006',
    name: 'Espacio público / parque abandonado',
    slug: 'espacio-publico-inseguro',
    icon_name: 'map-pin',
    applicable_type: 'reporte_comunitario',
    sort_order: 6,
    is_active: true,
  },
];

export const SEED_COMMUNITY_REPORTS: CommunityReportItem[] = [
  {
    public_code: 'LT-2026-000341',
    category: {
      id: 'u1000000-0000-0000-0000-000000000002',
      name: 'Alumbrado público',
      slug: 'alumbrado-publico',
      icon_name: 'lightbulb',
    },
    description: 'Tres postes de luz apagados desde hace una semana cerca al Parque Central de La Tinguiña. La zona queda muy oscura de noche.',
    address_reference: 'Av. Las Palmeras con Jr. Tacna, frente a la bodega Don Lucho',
    status: 'en_atencion',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    media_urls: ['https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=60'],
    share_count: 14,
  },
  {
    public_code: 'LT-2026-000342',
    category: {
      id: 'u1000000-0000-0000-0000-000000000001',
      name: 'Bache o pista dañada',
      slug: 'bache-pista-danada',
      icon_name: 'road',
    },
    description: 'Bache profundo en la pista que causa daños a mototaxis y vehículos de transporte público.',
    address_reference: 'Calle Buenos Aires cuadra 4',
    status: 'pendiente',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    media_urls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60'],
    share_count: 8,
  },
  {
    public_code: 'LT-2026-000343',
    category: {
      id: 'u1000000-0000-0000-0000-000000000003',
      name: 'Basura acumulada',
      slug: 'basura-acumulada',
      icon_name: 'trash-2',
    },
    description: 'Acumulación de desmonte y bolsas de basura en esquina descampada.',
    address_reference: 'Prolongación Pachacútec cerca al canal',
    status: 'derivado',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    media_urls: ['https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60'],
    share_count: 22,
  },
];

export const CommunityReportsService = {
  async getCategories(): Promise<Category[]> {
    try {
      const data = await apiFetch<Category[]>(
        `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/categories/`
      );
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return SEED_COMMUNITY_CATEGORIES;
    } catch (e) {
      console.warn('Usando categorías locales comunitarias:', e);
      return SEED_COMMUNITY_CATEGORIES;
    }
  },

  async createReport(
    payload: CreateCommunityReportPayload
  ): Promise<PublicReportCreatedResponse> {
    try {
      return await apiFetch<PublicReportCreatedResponse>(
        `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports`,
        {
          method: 'POST',
          body: JSON.stringify({
            category_id: payload.category_id,
            description: payload.description,
            latitude: payload.latitude ?? null,
            longitude: payload.longitude ?? null,
            address_reference: payload.address_reference || '',
          }),
        }
      );
    } catch (error: any) {
      if (error.status === 0 || error.status === 408) {
        const year = new Date().getFullYear();
        const rand = Math.floor(100000 + Math.random() * 900000);
        return {
          public_code: `LT-${year}-${rand}`,
          status: 'pendiente',
          created_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  async uploadEvidence(
    publicCode: string,
    fileUri: string,
    fileName = 'falla_urbana.jpg',
    mimeType = 'image/jpeg'
  ): Promise<any> {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      // @ts-ignore
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });
    }

    return await apiFetch(
      `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports/${encodeURIComponent(
        publicCode
      )}/media`,
      {
        method: 'POST',
        body: formData as any,
      }
    );
  },

  async listCommunityReports(skip = 0, limit = 50): Promise<CommunityReportItem[]> {
    try {
      const data = await apiFetch<any[]>(
        `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports?skip=${skip}&limit=${limit}`
      );
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          ...item,
          category: item.category || {
            id: item.category_id || '',
            name: item.category_name || 'Reporte Vecinal',
            slug: '',
            icon_name: 'map-pin',
          },
          media_urls: item.media_urls || (item.image_url ? [item.image_url] : []),
        }));
      }
      return SEED_COMMUNITY_REPORTS;
    } catch (e) {
      console.warn('Usando reportes comunitarios mock:', e);
      return SEED_COMMUNITY_REPORTS;
    }
  },

  async getCommunityReport(publicCode: string): Promise<CommunityReportItem> {
    try {
      const data = await apiFetch<any>(
        `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports/${encodeURIComponent(
          publicCode
        )}`
      );
      if (data) {
        return {
          ...data,
          category: data.category || {
            id: data.category_id || '',
            name: data.category_name || 'Reporte Vecinal',
            slug: '',
            icon_name: 'map-pin',
          },
          media_urls: data.media_urls || (data.image_url ? [data.image_url] : []),
        };
      }
      throw new Error('Reporte no encontrado');
    } catch (e) {
      const found = SEED_COMMUNITY_REPORTS.find((r) => r.public_code === publicCode);
      if (found) return found;
      throw e;
    }
  },

  async trackShare(publicCode: string, platform = 'whatsapp'): Promise<void> {
    try {
      await apiFetch(
        `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports/${encodeURIComponent(
          publicCode
        )}/share`,
        {
          method: 'POST',
          body: JSON.stringify({ platform }),
        }
      );
    } catch (e) {
      // Non-blocking metric tracking
      console.warn('Track share warning:', e);
    }
  },
};
