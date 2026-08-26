export type OfficerRole = 'admin' | 'comisario' | 'operador' | 'moderador';

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

export type GuideContentType = 'video' | 'articulo' | 'mixto';

export type GuideResourceType = 'video' | 'texto' | 'imagen' | 'enlace';

export interface Officer {
  id: string;
  full_name: string;
  email: string;
  role: OfficerRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name?: string | null;
  applicable_type: ReportType;
  is_emergency_default: boolean;
  sort_order: number;
}

export interface SignedMedia {
  id: string;
  media_type: MediaType;
  download_url: string;
  thumbnail_url?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
}

export interface StatusHistoryItem {
  old_status?: string | null;
  new_status: string;
  note?: string | null;
  created_at: string;
}

export interface CrimeReportListItem {
  id: string;
  public_code: string;
  category_name: string;
  status: ReportStatus;
  priority: ReportPriority;
  is_emergency: boolean;
  description: string;
  address_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrimeReportDetail {
  id: string;
  public_code: string;
  report_type: ReportType;
  category: Category;
  description: string;
  status: ReportStatus;
  priority: ReportPriority;
  is_emergency: boolean;
  latitude?: number | null;
  longitude?: number | null;
  address_reference?: string | null;
  location_note?: string | null;
  internal_note?: string | null;
  created_at: string;
  updated_at: string;
  media: SignedMedia[];
  status_history: StatusHistoryItem[];
}

export interface CommunityReportListItem {
  id: string;
  public_code: string;
  category_name: string;
  status: ReportStatus;
  priority: ReportPriority;
  description: string;
  address_reference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  shares_count: number;
  image_url?: string | null;
  created_at: string;
}

export interface CommunityReportDetail {
  id: string;
  public_code: string;
  category: Category;
  status: ReportStatus;
  priority: ReportPriority;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  address_reference?: string | null;
  location_note?: string | null;
  shares_count: number;
  media_urls: string[];
  status_history: StatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface GuideCategory {
  id: string;
  name: string;
  slug: string;
  icon_name?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface GuideResource {
  id: string;
  title?: string | null;
  resource_type: GuideResourceType;
  media_url?: string | null;
  thumbnail_url?: string | null;
  external_url?: string | null;
  body?: string | null;
  duration_seconds?: number | null;
  sort_order: number;
  created_at: string;
}

export interface GuideItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category_id?: string | null;
  category_name?: string | null;
  content_type: GuideContentType;
  main_video_url?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  transcript?: string | null;
  is_featured: boolean;
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  sort_order: number;
  resources?: GuideResource[];
  created_at: string;
  updated_at?: string;
}

export interface LiveAlertEvent {
  id: string;
  event_type: 'NEW_CRIME_REPORT' | 'NEW_COMMUNITY_REPORT' | 'STATUS_CHANGED';
  public_code: string;
  priority: ReportPriority;
  category_name: string;
  extra_data?: Record<string, any>;
  timestamp: string;
  read?: boolean;
}
