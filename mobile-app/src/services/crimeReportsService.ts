import { Platform } from 'react-native';
import { API_CONFIG } from '@/config/api.config';
import { apiFetch } from './apiClient';
import {
  Category,
  CreateCrimeReportPayload,
  PublicReportCreatedResponse,
  ReportStatusDetail,
} from '@/types';

// Fallback seed categories if backend is booting or unreachable
export const SEED_CRIME_CATEGORIES: Category[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Robo o hurto',
    slug: 'robo-hurto',
    icon_name: 'shield-alert',
    applicable_type: 'denuncia_anonima',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Violencia familiar',
    slug: 'violencia-familiar',
    icon_name: 'heart-broken',
    applicable_type: 'denuncia_anonima',
    sort_order: 2,
    is_active: true,
    is_emergency_default: true,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Extorsión',
    slug: 'extorsion',
    icon_name: 'phone-incoming',
    applicable_type: 'denuncia_anonima',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Sospechosos',
    slug: 'sospechosos',
    icon_name: 'eye',
    applicable_type: 'denuncia_anonima',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Drogas o microcomercialización',
    slug: 'drogas-venta-ilegal',
    icon_name: 'alert-triangle',
    applicable_type: 'denuncia_anonima',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    name: 'Otro delito',
    slug: 'otro-delito',
    icon_name: 'help-circle',
    applicable_type: 'denuncia_anonima',
    sort_order: 6,
    is_active: true,
  },
];

export const CrimeReportsService = {
  async getCategories(): Promise<Category[]> {
    try {
      const data = await apiFetch<Category[]>(
        `${API_CONFIG.CRIME_REPORTS_BASE_URL}/categories/`
      );
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return SEED_CRIME_CATEGORIES;
    } catch (e) {
      console.warn('Usando categorías locales de denuncia:', e);
      return SEED_CRIME_CATEGORIES;
    }
  },

  async createReport(
    payload: CreateCrimeReportPayload
  ): Promise<PublicReportCreatedResponse> {
    try {
      return await apiFetch<PublicReportCreatedResponse>(
        `${API_CONFIG.CRIME_REPORTS_BASE_URL}/reports`,
        {
          method: 'POST',
          body: JSON.stringify({
            category_id: payload.category_id,
            description: payload.description,
            priority: payload.priority || 'media',
            is_emergency: payload.is_emergency || false,
            latitude: payload.latitude ?? null,
            longitude: payload.longitude ?? null,
            address_reference: payload.address_reference || '',
            location_note: payload.location_note || '',
            followup_code: payload.followup_code || null,
          }),
        }
      );
    } catch (error: any) {
      // If server unreachable, provide offline receipt simulation
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
    fileName = 'evidencia.jpg',
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
      `${API_CONFIG.CRIME_REPORTS_BASE_URL}/reports/${encodeURIComponent(
        publicCode
      )}/media`,
      {
        method: 'POST',
        body: formData as any,
      }
    );
  },

  async getReportStatus(
    publicCode: string,
    followupCode?: string
  ): Promise<ReportStatusDetail> {
    const url = new URL(
      `${API_CONFIG.CRIME_REPORTS_BASE_URL}/reports/${encodeURIComponent(
        publicCode.trim().toUpperCase()
      )}/status`
    );
    if (followupCode && followupCode.trim()) {
      url.searchParams.append('followup_code', followupCode.trim());
    }

    try {
      return await apiFetch<ReportStatusDetail>(url.toString());
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(
          `No se encontró ningún reporte registrado con el código ${publicCode}. Verifique e intente nuevamente.`
        );
      }
      throw error;
    }
  },
};
