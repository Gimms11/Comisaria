export type ReportType = 'denuncia_anonima' | 'reporte_comunitario';

export type ReportStatus =
  | 'pendiente'
  | 'en_revision'
  | 'en_atencion'
  | 'derivado'
  | 'resuelto'
  | 'archivado'
  | 'rechazado';

export type ReportPriority = 'baja' | 'media' | 'alta' | 'urgente';

export type MediaType = 'foto' | 'video' | 'audio';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  applicable_type: ReportType;
  sort_order: number;
  is_active: boolean;
  is_emergency_default?: boolean;
}

export interface CreateCrimeReportPayload {
  category_id: string;
  description: string;
  priority?: ReportPriority;
  is_emergency?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  address_reference?: string;
  location_note?: string;
  followup_code?: string;
}

export interface PublicReportCreatedResponse {
  public_code: string;
  status: ReportStatus;
  created_at: string;
}

export interface StatusHistoryItem {
  status: string;
  note?: string | null;
  created_at: string;
}

export interface ReportStatusDetail {
  public_code: string;
  status: ReportStatus;
  category_name: string;
  description: string;
  is_verified: boolean;
  created_at: string;
  updated_at?: string | null;
  history: StatusHistoryItem[];
}

export interface CreateCommunityReportPayload {
  category_id: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  address_reference?: string;
}

export interface CommunityReportItem {
  public_code: string;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
    icon_name?: string;
  };
  category_name?: string;
  category_id?: string;
  category_slug?: string;
  description: string;
  address_reference?: string | null;
  status: ReportStatus;
  created_at: string;
  media_urls: string[];
  share_count?: number;
}

export interface GuideCategory {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  sort_order: number;
}

export interface GuideStep {
  step_number: number;
  title: string;
  instruction: string;
  icon_name?: string | null;
}

export interface GuideResource {
  title: string;
  file_url: string;
  file_type: string;
}

export interface GuideItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content_type: 'video' | 'articulo' | 'infografia';
  main_video_url?: string | null;
  thumbnail_url?: string | null;
  duration_seconds: number;
  is_featured: boolean;
  category?: {
    id?: string;
    name?: string;
    slug?: string;
    icon_name?: string;
  };
  category_name?: string;
  category_id?: string;
  view_count: number;
  helpful_count: number;
  steps_count?: number;
  steps?: GuideStep[];
  resources?: GuideResource[];
}

export interface LocalReportReceipt {
  public_code: string;
  type: ReportType;
  category_name: string;
  created_at: string;
  followup_code?: string;
  address_reference?: string;
  description_summary: string;
}
