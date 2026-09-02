import { API_CONFIG } from '@/config/api.config';
import { apiFetch, apiUploadFile } from './apiClient';
import {
  Category,
  CreateCrimeReportPayload,
  PublicReportCreatedResponse,
  ReportStatusDetail,
} from '@/types';

const DEFAULT_CRIME_CATEGORIES: Category[] = [
  {
    id: 'cat-del-01',
    name: 'Robo / Asalto a Mano Armada',
    slug: 'robo-asalto',
    icon_name: 'alert-octagon',
    applicable_type: 'denuncia_anonima',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'cat-del-02',
    name: 'Extorsión / Cobro de Cupos',
    slug: 'extorsion',
    icon_name: 'dollar-sign',
    applicable_type: 'denuncia_anonima',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'cat-del-03',
    name: 'Violencia Familiar y Género',
    slug: 'violencia-familiar',
    icon_name: 'heart',
    applicable_type: 'denuncia_anonima',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'cat-del-04',
    name: 'Microcomercialización de Drogas',
    slug: 'drogas-estupefacientes',
    icon_name: 'disc',
    applicable_type: 'denuncia_anonima',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'cat-del-05',
    name: 'Sujetos / Vehículos Sospechosos',
    slug: 'sospechosos',
    icon_name: 'eye',
    applicable_type: 'denuncia_anonima',
    sort_order: 5,
    is_active: true,
  },
  {
    id: 'cat-del-06',
    name: 'Otro Delito / Falta Grave',
    slug: 'otro-delito',
    icon_name: 'shield-alert',
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
      return DEFAULT_CRIME_CATEGORIES;
    } catch {
      return DEFAULT_CRIME_CATEGORIES;
    }
  },

  async createReport(
    payload: CreateCrimeReportPayload
  ): Promise<PublicReportCreatedResponse> {
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
  },

  async uploadEvidence(
    publicCode: string,
    fileUri: string,
    fileName = 'evidencia.jpg',
    mimeType = 'image/jpeg'
  ): Promise<any> {
    const url = `${API_CONFIG.CRIME_REPORTS_BASE_URL}/reports/${encodeURIComponent(
      publicCode
    )}/media`;
    return await apiUploadFile(url, fileUri, 'file', fileName, mimeType);
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
