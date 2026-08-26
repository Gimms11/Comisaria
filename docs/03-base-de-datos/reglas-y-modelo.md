# Modelo de Datos y Reglas de la Base de Datos

Especificación de la capa de persistencia en PostgreSQL para la Fase 1.

---

## 1. Reglas de Oro de la Base de Datos

1. **Anonimato absoluto del denunciante:**
   - No almacenar `user_id`, nombres, DNI, correo electrónico ni teléfonos para denuncias anónimas.
   - Prohibido registrar o asociar direcciones IP a los registros de denuncias.
2. **Archivos multimedia desacoplados:**
   - Los binarios (fotos, videos, audios) se custodian en almacenamiento cloud (S3 / Supabase Storage / GCP Cloud Storage).
   - En base de datos únicamente residen identificadores, rutas relativas y metadatos técnicos.
3. **Separación de dominios:**
   - Aislamiento entre reportes cívicos/criminales y el módulo de contenido educativo (guías).
4. **Seguimiento seguro de denuncias:**
   - Identificador público visible (ej. `LT-2026-000123`).
   - El código secreto de seguimiento opcional solo se almacena hasheado (`followup_code_hash`), nunca en texto claro.
5. **Auditoría y trazabilidad policial:**
   - Todo cambio de estado de un reporte genera un registro inmutable en `report_status_history` vinculado al oficial responsable.

---

## 2. Diagrama Textual de Entidades

### Reportes Ciudadanos
- **`report_categories`**: Clasificación jerárquica para denuncias y problemas urbanos.
- **`reports`**: Registro maestro de la denuncia o reporte cívico.
- **`report_media`**: Archivos de evidencia asociados.
- **`report_status_history`**: Bitácora inmutable de transiciones de estado.
- **`report_share_events`**: Métricas anónimas de difusión cívica.

### Biblioteca Digital de Guías
- **`guide_categories`**: Clasificación temática de los microcontenidos.
- **`guides`**: Entidad principal de microvideos verticales y artículos.
- **`guide_resources`**: Recursos complementarios (pasos, enlaces, imágenes, transcripciones).
- **`guide_analytics_daily`**: Métricas agregadas por fecha (vistas, valoraciones, compartidos).

### Panel Policial
- **`officers`**: Usuarios y efectivos policiales autorizados con control de acceso por roles.

---

## 3. Explicación Detallada de Tablas

### `officers` (Efectivos y Administradores)
No es accesible para ciudadanos. Gestiona las cuentas de acceso al panel policial.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único del oficial. |
| `full_name` | TEXT | Nombres y apellidos completos. |
| `email` | TEXT (Unique) | Correo institucional de acceso. |
| `password_hash` | TEXT | Contraseña con hash seguro (bcrypt/argon2). |
| `role` | officer_role | Rol: `admin`, `comisario`, `operador`, `moderador`. |
| `is_active` | BOOLEAN | Estado activo/inactivo del personal. |

### `report_categories` (Categorías de Reportes)
Define los tipos de denuncia o incidencias comunitarias admitidas.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador de la categoría. |
| `name` | TEXT | Nombre visible (ej. "Extorsión", "Alumbrado público"). |
| `slug` | TEXT (Unique) | Identificador URL-friendly. |
| `applicable_type` | report_type | Aplica a: `denuncia_anonima` o `reporte_comunitario`. |
| `is_emergency_default` | BOOLEAN | Indica si activa advertencia de llamada al 105 por defecto. |
| `sort_order` | INTEGER | Orden de presentación en la interfaz móvil. |

### `reports` (Reportes y Denuncias)
Entidad central de recepción.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador interno. |
| `public_code` | TEXT (Unique) | Código de seguimiento (ej. `LT-2026-000123`). |
| `followup_code_hash` | TEXT | Hash SHA-256 / bcrypt de la clave secreta ciudadana. |
| `report_type` | report_type | `denuncia_anonima` | `reporte_comunitario`. |
| `category_id` | UUID (FK) | Relación a `report_categories`. |
| `description` | TEXT | Detalle de los hechos (máximo 5000 caracteres). |
| `status` | report_status | Estado actual del reporte. |
| `priority` | report_priority | Urgencia: `baja`, `media`, `alta`, `urgente`. |
| `is_emergency` | BOOLEAN | Flag de emergencia inmediata. |
| `latitude`, `longitude` | NUMERIC(9,6) | Coordenadas GPS opcionales. |
| `address_reference` | TEXT | Descripción textual del lugar o referencias físicas. |
| `shares_count` | INTEGER | Contador de compartidos en redes sociales. |
| `internal_note` | TEXT | Anotaciones reservadas para el personal policial. |

### `report_media` (Evidencia Multimedia)
Almacena las referencias a fotos, videos y notas de voz.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador del archivo. |
| `report_id` | UUID (FK) | Relación al reporte asociado. |
| `media_type` | media_type | `foto`, `video`, `audio`. |
| `storage_path` | TEXT | Ruta de almacenamiento en el bucket seguro. |
| `thumbnail_path` | TEXT | Miniatura optimizada para previsualización. |
| `mime_type` | TEXT | Tipo MIME sanitizado. |
| `size_bytes` | INTEGER | Tamaño en bytes. |

### `report_status_history` (Historial de Estados)
Auditoría inmutable de transiciones de estado.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador del evento. |
| `report_id` | UUID (FK) | Reporte modificado. |
| `officer_id` | UUID (FK) | Oficial que realizó el cambio (NULL si fue el sistema). |
| `old_status` | report_status | Estado previo. |
| `new_status` | report_status | Nuevo estado asignado. |
| `note` | TEXT | Justificación del cambio de estado. |

### `report_share_events` (Eventos de Compartir)
Métricas anónimas de difusión de reportes comunitarios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador del evento. |
| `report_id` | UUID (FK) | Reporte compartido. |
| `platform` | TEXT | Red destino (`whatsapp`, `facebook`, `instagram`, `other`). |

### `guide_categories`, `guides` y `guide_resources` (Biblioteca de Prevención)
Estructura modular para el reproductor de videos verticales y manuales de ayuda ciudadana.
- `guides` almacena el video vertical, miniatura, transcripción y contadores de utilidad.
- `guide_resources` soporta guías enriquecidas compuestas por múltiples pasos o enlaces.
- `guide_analytics_daily` consolida el uso diario anónimo para analítica preventiva.
