-- =====================================================
-- Datos Iniciales / Seeds - Fase 1
-- Plataforma de Apoyo Ciudadano - La Tinguiña
-- =====================================================

-- =====================================================
-- 0. Oficiales y Administradores Iniciales
-- =====================================================

INSERT INTO officers (id, full_name, email, password_hash, role, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador General PNP', 'admin@comisaria.gob.pe', '$argon2id$v=19$m=65536,t=2,p=2$upeyVqoVwjgHIKRUinFOSQ$MD+W54yTbRTLZoI7gyqIdvwlnNm6567jdpNyhkirmGw', 'admin', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Mayor PNP Comisario La Tinguiña', 'comisario.tinguina@policia.gob.pe', '$argon2id$v=19$m=65536,t=2,p=2$upeyVqoVwjgHIKRUinFOSQ$MD+W54yTbRTLZoI7gyqIdvwlnNm6567jdpNyhkirmGw', 'comisario', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Suboficial Operador de Guardia', 'operador.guardia@policia.gob.pe', '$argon2id$v=19$m=65536,t=2,p=2$upeyVqoVwjgHIKRUinFOSQ$MD+W54yTbRTLZoI7gyqIdvwlnNm6567jdpNyhkirmGw', 'operador', TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Comisario Mayor Admin', 'admin@tinguina.pnp.gob.pe', '$argon2id$v=19$m=65536,t=2,p=2$QIhx7j2nlJKSEuKcE+Lcuw$AezrOzmgk8yo7b/2U2oJk2+9w0NSdKCMCQKTsno5S84', 'admin', TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Suboficial Operador', 'operador@tinguina.pnp.gob.pe', '$argon2id$v=19$m=65536,t=2,p=2$Zax1jnHuXcv5X4vR2tv7Xw$RnTe6sym7IG8uWb1mEY18zYm7S5HhgrsKWrDGt+TCIo', 'operador', TRUE),
  ('66666666-6666-6666-6666-666666666666', 'Lic. Moderador Comunitario', 'moderador.comunitario@policia.gob.pe', '$argon2id$v=19$m=65536,t=2,p=2$upeyVqoVwjgHIKRUinFOSQ$MD+W54yTbRTLZoI7gyqIdvwlnNm6567jdpNyhkirmGw', 'moderador', TRUE)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- =====================================================
-- 1. Categorías de Denuncias Anónimas
-- =====================================================

INSERT INTO report_categories (name, slug, icon_name, applicable_type, sort_order)
VALUES
  ('Robo o hurto', 'robo-hurto', 'shield', 'denuncia_anonima', 1),
  ('Violencia familiar', 'violencia-familiar', 'alert', 'denuncia_anonima', 2),
  ('Extorsión', 'extorsion', 'phone', 'denuncia_anonima', 3),
  ('Sospechosos', 'sospechosos', 'eye', 'denuncia_anonima', 4),
  ('Drogas o venta ilegal', 'drogas-venta-ilegal', 'warning', 'denuncia_anonima', 5),
  ('Otro delito', 'otro-delito', 'question', 'denuncia_anonima', 6);

-- =====================================================
-- 2. Categorías de Reportes Comunitarios
-- =====================================================

INSERT INTO report_categories (name, slug, icon_name, applicable_type, sort_order)
VALUES
  ('Bache o pista dañada', 'bache-pista-danada', 'road', 'reporte_comunitario', 1),
  ('Alumbrado público', 'alumbrado-publico', 'bulb', 'reporte_comunitario', 2),
  ('Basura acumulada', 'basura-acumulada', 'trash', 'reporte_comunitario', 3),
  ('Poste en mal estado', 'poste-mal-estado', 'pole', 'reporte_comunitario', 4),
  ('Señalización dañada', 'senalizacion-danada', 'sign', 'reporte_comunitario', 5),
  ('Espacio público inseguro', 'espacio-publico-inseguro', 'map', 'reporte_comunitario', 6);

-- =====================================================
-- 3. Categorías de Guías Digitales
-- =====================================================

INSERT INTO guide_categories (name, slug, icon_name, sort_order)
VALUES
  ('Guías rápidas', 'guias-rapidas', 'play', 1),
  ('Seguridad ciudadana', 'seguridad-ciudadana', 'shield', 2),
  ('Violencia familiar', 'violencia-familiar', 'heart', 3),
  ('Extorsión y llamadas', 'extorsion-llamadas', 'phone', 4),
  ('Trámites y documentos', 'tramites-documentos', 'file', 5);

-- =====================================================
-- 4. Guías Iniciales Estilo TikTok
-- =====================================================

INSERT INTO guides (
  category_id,
  title,
  slug,
  summary,
  content_type,
  main_video_url,
  thumbnail_url,
  duration_seconds,
  is_featured,
  is_published
)
SELECT
  id,
  'Cómo hacer una denuncia anónima segura',
  'denuncia-anonima-segura',
  'Aprende cómo reportar sin exponer tu identidad.',
  'video',
  'https://cdn.tuapp.pe/guias/denuncia-anonima-segura.mp4',
  'https://cdn.tuapp.pe/guias/denuncia-anonima-segura.jpg',
  45,
  TRUE,
  TRUE
FROM guide_categories
WHERE slug = 'guias-rapidas';

INSERT INTO guides (
  category_id,
  title,
  slug,
  summary,
  content_type,
  main_video_url,
  thumbnail_url,
  duration_seconds,
  is_featured,
  is_published
)
SELECT
  id,
  'Qué hacer ante una llamada de extorsión',
  'llamada-extorsion',
  'Pasos inmediatos para protegerte y reportar.',
  'video',
  'https://cdn.tuapp.pe/guias/llamada-extorsion.mp4',
  'https://cdn.tuapp.pe/guias/llamada-extorsion.jpg',
  60,
  TRUE,
  TRUE
FROM guide_categories
WHERE slug = 'extorsion-llamadas';

INSERT INTO guides (
  category_id,
  title,
  slug,
  summary,
  content_type,
  main_video_url,
  thumbnail_url,
  duration_seconds,
  is_featured,
  is_published
)
SELECT
  id,
  'Cómo reportar un bache o problema del barrio',
  'reportar-bache-barrio',
  'Usa la app para reportar problemas comunitarios.',
  'video',
  'https://cdn.tuapp.pe/guias/reportar-bache.mp4',
  'https://cdn.tuapp.pe/guias/reportar-bache.jpg',
  30,
  FALSE,
  TRUE
FROM guide_categories
WHERE slug = 'guias-rapidas';

-- =====================================================
-- 5. Reportes Comunitarios de Ejemplo para La Tinguiña
-- =====================================================

INSERT INTO reports (
  id, public_code, report_type, category_id, description, status, priority, latitude, longitude, address_reference, shares_count
)
SELECT
  '77777777-7777-7777-7777-777777777771',
  'LT-2026-000341',
  'reporte_comunitario',
  id,
  'Tres postes de luz apagados desde hace una semana cerca al Parque Central de La Tinguiña. La zona queda muy oscura de noche.',
  'en_atencion',
  'media',
  -14.036500,
  -75.719800,
  'Av. Las Palmeras con Jr. Tacna, frente a la bodega Don Lucho',
  14
FROM report_categories
WHERE slug = 'alumbrado-publico'
ON CONFLICT (public_code) DO NOTHING;

INSERT INTO reports (
  id, public_code, report_type, category_id, description, status, priority, latitude, longitude, address_reference, shares_count
)
SELECT
  '77777777-7777-7777-7777-777777777772',
  'LT-2026-000342',
  'reporte_comunitario',
  id,
  'Bache profundo en la pista que causa daños a mototaxis y vehículos de transporte público.',
  'pendiente',
  'media',
  -14.032100,
  -75.724500,
  'Calle Buenos Aires cuadra 4',
  8
FROM report_categories
WHERE slug = 'bache-pista-danada'
ON CONFLICT (public_code) DO NOTHING;

INSERT INTO reports (
  id, public_code, report_type, category_id, description, status, priority, latitude, longitude, address_reference, shares_count
)
SELECT
  '77777777-7777-7777-7777-777777777773',
  'LT-2026-000343',
  'reporte_comunitario',
  id,
  'Acumulación de desmonte y bolsas de basura en esquina descampada.',
  'derivado',
  'baja',
  -14.039200,
  -75.715600,
  'Prolongación Pachacútec cerca al canal',
  22
FROM report_categories
WHERE slug = 'basura-acumulada'
ON CONFLICT (public_code) DO NOTHING;
