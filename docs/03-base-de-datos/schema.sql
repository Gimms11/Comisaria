-- =====================================================
-- Esquema de Base de Datos - Fase 1
-- Plataforma de Apoyo Ciudadano - La Tinguiña
-- PostgreSQL DDL
-- =====================================================

-- Extensión para UUIDs seguros
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Tipos Enumerados (ENUMs)
-- =====================================================

CREATE TYPE report_type AS ENUM (
  'denuncia_anonima',
  'reporte_comunitario'
);

CREATE TYPE report_status AS ENUM (
  'pendiente',
  'en_revision',
  'en_atencion',
  'derivado',
  'resuelto',
  'archivado',
  'rechazado'
);

CREATE TYPE report_priority AS ENUM (
  'baja',
  'media',
  'alta',
  'urgente'
);

CREATE TYPE media_type AS ENUM (
  'foto',
  'video',
  'audio'
);

CREATE TYPE officer_role AS ENUM (
  'admin',
  'comisario',
  'operador',
  'moderador'
);

CREATE TYPE guide_content_type AS ENUM (
  'video',
  'articulo',
  'mixto'
);

CREATE TYPE guide_resource_type AS ENUM (
  'video',
  'texto',
  'imagen',
  'enlace'
);

-- =====================================================
-- Trigger Genérico: Actualización automática de updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. Usuarios internos de la comisaría
-- =====================================================

CREATE TABLE officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role officer_role NOT NULL DEFAULT 'operador',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER officers_set_updated_at
BEFORE UPDATE ON officers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 2. Categorías de reportes
-- =====================================================

CREATE TABLE report_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT,
  applicable_type report_type NOT NULL,
  is_emergency_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER report_categories_set_updated_at
BEFORE UPDATE ON report_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 2b. Secuencia atómica para public_code de reportes
-- =====================================================

CREATE SEQUENCE seq_reports_public_code
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- Función helper para generar LT-YYYY-XXXXXX
CREATE OR REPLACE FUNCTION generate_public_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'LT-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
         LPAD(nextval('seq_reports_public_code')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Reportes ciudadanos
-- =====================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Código público visible para seguimiento
  public_code TEXT UNIQUE NOT NULL,

  -- Hash de la clave secreta ciudadana (nunca almacenar en texto claro)
  followup_code_hash TEXT,

  report_type report_type NOT NULL,
  category_id UUID NOT NULL REFERENCES report_categories(id),

  description TEXT NOT NULL,

  status report_status NOT NULL DEFAULT 'pendiente',
  priority report_priority NOT NULL DEFAULT 'media',

  is_emergency BOOLEAN NOT NULL DEFAULT FALSE,

  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  address_reference TEXT,
  location_note TEXT,

  -- Contador de difusión para reportes comunitarios
  shares_count INTEGER NOT NULL DEFAULT 0,

  -- Notas internas de uso exclusivo policial
  internal_note TEXT,

  source TEXT NOT NULL DEFAULT 'mobile_app',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_location_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR
    (latitude IS NOT NULL AND longitude IS NOT NULL)
  ),

  CONSTRAINT reports_description_length CHECK (
    char_length(description) <= 5000
  )
);

CREATE TRIGGER reports_set_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 4. Multimedia de reportes
-- =====================================================

CREATE TABLE report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  media_type media_type NOT NULL,

  -- Ruta en bucket cloud (S3/Supabase), nunca binario directo
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,

  mime_type TEXT,
  size_bytes INTEGER,

  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT report_media_size_check CHECK (
    size_bytes IS NULL OR size_bytes >= 0
  )
);

-- =====================================================
-- 5. Historial de estados de reportes
-- =====================================================

CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,

  old_status report_status,
  new_status report_status NOT NULL,
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. Eventos de compartir en redes
-- =====================================================

CREATE TABLE report_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  platform TEXT NOT NULL, -- whatsapp, facebook, instagram, messenger, other

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. Categorías de guías digitales
-- =====================================================

CREATE TABLE guide_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER guide_categories_set_updated_at
BEFORE UPDATE ON guide_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 8. Guías digitales estilo TikTok
-- =====================================================

CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES guide_categories(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,

  content_type guide_content_type NOT NULL DEFAULT 'video',

  -- Referencia o URL de streaming CDN
  main_video_url TEXT,
  thumbnail_url TEXT,

  duration_seconds INTEGER,
  transcript TEXT,

  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,

  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,

  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT guides_duration_check CHECK (
    duration_seconds IS NULL OR duration_seconds >= 0
  )
);

CREATE TRIGGER guides_set_updated_at
BEFORE UPDATE ON guides
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 9. Recursos complementarios de guías
-- =====================================================

CREATE TABLE guide_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,

  resource_type guide_resource_type NOT NULL,

  title TEXT,
  body TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  external_url TEXT,

  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT guide_resources_duration_check CHECK (
    duration_seconds IS NULL OR duration_seconds >= 0
  )
);

-- =====================================================
-- 10. Métricas analíticas diarias de guías
-- =====================================================

CREATE TABLE guide_analytics_daily (
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,

  views INTEGER NOT NULL DEFAULT 0,
  helpful INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (guide_id, day)
);

-- =====================================================
-- Índices para optimización de consultas
-- =====================================================

CREATE INDEX idx_reports_list
ON reports (report_type, status, created_at DESC);

CREATE INDEX idx_reports_category
ON reports (category_id);

CREATE INDEX idx_reports_geo
ON reports (latitude, longitude);

CREATE INDEX idx_reports_public_code
ON reports (public_code);

CREATE INDEX idx_report_media_report
ON report_media (report_id);

CREATE INDEX idx_report_status_history_report
ON report_status_history (report_id);

CREATE INDEX idx_report_share_events_report
ON report_share_events (report_id);

CREATE INDEX idx_guides_published
ON guides (is_published, is_featured, sort_order);

CREATE INDEX idx_guides_category
ON guides (category_id);

CREATE INDEX idx_guide_resources_guide
ON guide_resources (guide_id);

CREATE INDEX idx_guide_analytics_daily_day
ON guide_analytics_daily (day);
