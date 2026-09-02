import { API_CONFIG } from '@/config/api.config';
import { apiFetch, apiUploadFile } from './apiClient';
import {
  Category,
  CommunityReportItem,
  CreateCommunityReportPayload,
  PublicReportCreatedResponse,
} from '@/types';

const DEFAULT_COMMUNITY_CATEGORIES: Category[] = [
  {
    id: 'cat-civ-01',
    name: 'Alumbrado Público Defectuoso',
    slug: 'alumbrado-publico',
    icon_name: 'zap',
    applicable_type: 'reporte_comunitario',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'cat-civ-02',
    name: 'Pistas y Baches Peligrosos',
    slug: 'pistas-baches',
    icon_name: 'alert-triangle',
    applicable_type: 'reporte_comunitario',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'cat-civ-03',
    name: 'Acumulación de Basura y Desmonte',
    slug: 'basura-desmonte',
    icon_name: 'trash-2',
    applicable_type: 'reporte_comunitario',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'cat-civ-04',
    name: 'Parques y Áreas Inseguras',
    slug: 'parques-areas-inseguras',
    icon_name: 'map-pin',
    applicable_type: 'reporte_comunitario',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'cat-civ-05',
    name: 'Ruidos Molestos / Perturbación',
    slug: 'ruidos-molestos',
    icon_name: 'volume-2',
    applicable_type: 'reporte_comunitario',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'cat-civ-06',
    name: 'Otro Problema Vecinal',
    slug: 'otro-vecinal',
    icon_name: 'help-circle',
    applicable_type: 'reporte_comunitario',
    sort_order: 6,
    is_active: true,
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
      return DEFAULT_COMMUNITY_CATEGORIES;
    } catch {
      return DEFAULT_COMMUNITY_CATEGORIES;
    }
  },

  async createReport(
    payload: CreateCommunityReportPayload
  ): Promise<PublicReportCreatedResponse> {
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
  },

  async uploadEvidence(
    publicCode: string,
    fileUri: string,
    fileName = 'falla_urbana.jpg',
    mimeType = 'image/jpeg'
  ): Promise<any> {
    const url = `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports/${encodeURIComponent(
      publicCode
    )}/media`;
    return await apiUploadFile(url, fileUri, 'file', fileName, mimeType);
  },

  async listCommunityReports(skip = 0, limit = 50): Promise<CommunityReportItem[]> {
    const data = await apiFetch<any[]>(
      `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports?skip=${skip}&limit=${limit}`
    );
    if (Array.isArray(data)) {
      return data.map((item) => {
        const catId = item.category_id || item.category?.id || '';
        const catName = item.category_name || item.category?.name || 'Reporte Vecinal';
        const catSlug = item.category_slug || item.category?.slug || '';
        return {
          ...item,
          category_id: catId,
          category_name: catName,
          category_slug: catSlug,
          category: item.category || {
            id: catId,
            name: catName,
            slug: catSlug,
            icon_name: 'map-pin',
          },
          media_urls: item.media_urls || (item.image_url ? [item.image_url] : []),
        };
      });
    }
    return [];
  },

  async getCommunityReport(publicCode: string): Promise<CommunityReportItem> {
    const data = await apiFetch<any>(
      `${API_CONFIG.COMMUNITY_REPORTS_BASE_URL}/community-reports/${encodeURIComponent(
        publicCode
      )}`
    );
    if (data) {
      const catId = data.category_id || data.category?.id || '';
      const catName = data.category_name || data.category?.name || 'Reporte Vecinal';
      const catSlug = data.category_slug || data.category?.slug || '';
      return {
        ...data,
        category_id: catId,
        category_name: catName,
        category_slug: catSlug,
        category: data.category || {
          id: catId,
          name: catName,
          slug: catSlug,
          icon_name: 'map-pin',
        },
        media_urls: data.media_urls || (data.image_url ? [data.image_url] : []),
      };
    }
    throw new Error('Reporte no encontrado');
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
