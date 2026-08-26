import {
  AuthTokens,
  Category,
  CrimeReportDetail,
  CrimeReportListItem,
  CommunityReportDetail,
  CommunityReportListItem,
  GuideCategory,
  GuideItem,
  Officer,
  ReportPriority,
  ReportStatus,
} from '../types';

const MS01_URL = import.meta.env.VITE_MS01_URL || 'http://localhost:8001';
const MS02_URL = import.meta.env.VITE_MS02_URL || 'http://localhost:8002';
const MS03_URL = import.meta.env.VITE_MS03_URL || 'http://localhost:8003';
const MS04_URL = import.meta.env.VITE_MS04_URL || 'http://localhost:8004';

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expired (401)
    if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${MS01_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshRes.ok) {
            const data: AuthTokens = await refreshRes.json();
            localStorage.setItem('access_token', data.access_token);
            headers['Authorization'] = `Bearer ${data.access_token}`;
            response = await fetch(url, { ...options, headers });
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.reload();
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
        }
      }
    }

    return response;
  }

  // --- MS-01: AUTH & GATEWAY ---
  async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const res = await fetch(`${MS01_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al iniciar sesión');
    }
    return res.json();
  }

  async getMe(): Promise<Officer> {
    const res = await this.fetchWithAuth(`${MS01_URL}/api/v1/auth/me`);
    if (!res.ok) throw new Error('Error al obtener perfil');
    return res.json();
  }

  async getWsTicket(): Promise<{ ticket: string; expires_in_seconds: number }> {
    const res = await this.fetchWithAuth(`${MS01_URL}/api/v1/auth/ws-ticket`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Error al generar ticket WebSocket');
    return res.json();
  }

  async listOfficers(): Promise<Officer[]> {
    const res = await this.fetchWithAuth(`${MS01_URL}/api/v1/officers/`);
    if (!res.ok) throw new Error('Error al listar oficiales');
    return res.json();
  }

  async createOfficer(data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }): Promise<Officer> {
    const res = await this.fetchWithAuth(`${MS01_URL}/api/v1/officers/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al registrar oficial');
    }
    return res.json();
  }

  async updateOfficer(id: string, data: Partial<Officer>): Promise<Officer> {
    const res = await this.fetchWithAuth(`${MS01_URL}/api/v1/officers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar oficial');
    return res.json();
  }

  // --- MS-02: DENUNCIAS ANÓNIMAS ---
  async listCrimeCategories(): Promise<Category[]> {
    const res = await fetch(`${MS02_URL}/api/v1/categories`);
    if (!res.ok) throw new Error('Error al cargar categorías de delitos');
    return res.json();
  }

  async listCrimeReports(params?: {
    status?: string;
    priority?: string;
    category_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; limit: number; offset: number; items: CrimeReportListItem[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.category_id) searchParams.append('category_id', params.category_id);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const res = await this.fetchWithAuth(`${MS02_URL}/api/v1/police/reports/?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Error al obtener denuncias');
    const data = await res.json();
    if (Array.isArray(data)) {
      return { total: data.length, limit: params?.limit || 50, offset: params?.offset || 0, items: data };
    }
    return {
      total: data.total ?? (data.items ? data.items.length : 0),
      limit: data.limit ?? (params?.limit || 50),
      offset: data.offset ?? 0,
      items: data.items ?? [],
    };
  }

  async getCrimeReportDetail(id: string): Promise<CrimeReportDetail> {
    const res = await this.fetchWithAuth(`${MS02_URL}/api/v1/police/reports/${id}`);
    if (!res.ok) throw new Error('Error al obtener detalle de denuncia');
    return res.json();
  }

  async updateCrimeReportStatus(
    id: string,
    data: { status: ReportStatus; note: string }
  ): Promise<any> {
    const res = await this.fetchWithAuth(`${MS02_URL}/api/v1/police/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar estado de la denuncia');
    return res.json();
  }

  async addCrimeReportNote(id: string, note: string): Promise<any> {
    const res = await this.fetchWithAuth(`${MS02_URL}/api/v1/police/reports/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('Error al agregar nota interna');
    return res.json();
  }

  // --- MS-03: REPORTES CIUDADANOS / COMUNITARIOS ---
  async listCommunityReports(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; limit: number; offset: number; items: CommunityReportListItem[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));

    const res = await this.fetchWithAuth(
      `${MS03_URL}/api/v1/police/community-reports/?${searchParams.toString()}`
    );
    if (!res.ok) throw new Error('Error al obtener reportes comunitarios');
    const data = await res.json();
    if (Array.isArray(data)) {
      return { total: data.length, limit: params?.limit || 50, offset: params?.offset || 0, items: data };
    }
    return {
      total: data.total ?? (data.items ? data.items.length : 0),
      limit: data.limit ?? (params?.limit || 50),
      offset: data.offset ?? 0,
      items: data.items ?? [],
    };
  }

  async getCommunityReportByCode(code: string): Promise<CommunityReportDetail> {
    const res = await fetch(`${MS03_URL}/api/v1/community-reports/${code}`);
    if (!res.ok) throw new Error('Error al obtener reporte comunitario');
    return res.json();
  }

  async updateCommunityReportStatus(
    id: string,
    data: { status: ReportStatus; note: string }
  ): Promise<any> {
    const res = await this.fetchWithAuth(`${MS03_URL}/api/v1/police/community-reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar reporte vecinal');
    return res.json();
  }

  // --- MS-04: GUÍAS, TRÁMITES Y CONTENIDO ---
  async listGuideCategories(): Promise<GuideCategory[]> {
    const res = await fetch(`${MS04_URL}/api/v1/guide-categories`);
    if (!res.ok) throw new Error('Error al obtener categorías de guías');
    return res.json();
  }

  async listAdminGuides(params?: {
    category_id?: string;
    is_published?: boolean;
    search?: string;
  }): Promise<GuideItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.append('category_id', params.category_id);
    if (params?.is_published !== undefined)
      searchParams.append('is_published', String(params.is_published));
    if (params?.search) searchParams.append('search', params.search);

    const res = await this.fetchWithAuth(`${MS04_URL}/api/v1/admin/guides/?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Error al listar guías');
    return res.json();
  }

  async createGuide(data: {
    title: string;
    summary: string;
    category_id?: string | null;
    content_type?: string;
    main_video_url?: string | null;
    thumbnail_url?: string | null;
    duration_seconds?: number | null;
    transcript?: string | null;
    is_featured?: boolean;
  }): Promise<GuideItem> {
    const res = await this.fetchWithAuth(`${MS04_URL}/api/v1/admin/guides`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear guía cívica');
    }
    return res.json();
  }

  async updateGuide(id: string, data: Partial<GuideItem>): Promise<GuideItem> {
    const res = await this.fetchWithAuth(`${MS04_URL}/api/v1/admin/guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar guía');
    return res.json();
  }

  async toggleGuidePublish(id: string, is_published: boolean): Promise<GuideItem> {
    const res = await this.fetchWithAuth(`${MS04_URL}/api/v1/admin/guides/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published }),
    });
    if (!res.ok) throw new Error('Error al cambiar publicación de la guía');
    return res.json();
  }

  async addGuideResource(
    guideId: string,
    data: {
      title: string;
      resource_type: string;
      media_url?: string | null;
      external_url?: string | null;
      body?: string | null;
    }
  ): Promise<any> {
    const res = await this.fetchWithAuth(`${MS04_URL}/api/v1/admin/guides/${guideId}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al adjuntar recurso a la guía');
    return res.json();
  }

  getWebSocketUrl(ticket: string): string {
    const wsHost = MS01_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsHost}/ws/v1/police/alerts?ticket=${ticket}`;
  }
}

export const api = new ApiClient();
