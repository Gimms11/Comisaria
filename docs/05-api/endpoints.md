# Especificación de Endpoints - API Fase 1

Arquitectura RESTful para los módulos ciudadano y administrativo.

---

## 1. Módulo Ciudadano (Público / Anónimo)

### `POST /api/v1/reports`
Registra una nueva denuncia anónima o reporte comunitario.
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "report_type": "denuncia_anonima", // "denuncia_anonima" | "reporte_comunitario"
    "category_id": "uuid-categoria",
    "description": "Texto descriptivo de los hechos...",
    "priority": "media",
    "is_emergency": false,
    "latitude": -14.032145,
    "longitude": -75.728912,
    "address_reference": "Av. Principal frente al parque",
    "followup_code_hash": "hash_opcional_sha256"
  }
  ```
- **Respuesta (201 Created):**
  ```json
  {
    "public_code": "LT-2026-000123",
    "status": "pendiente",
    "created_at": "2026-08-24T17:50:00Z"
  }
  ```

---

### `POST /api/v1/reports/media`
Sube archivo multimedia adjunto a un reporte.
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:**
  - `report_id`: UUID
  - `file`: Binario (JPG/PNG/MP4/M4A)
  - `media_type`: `foto` | `video` | `audio`
- **Respuesta (201 Created):**
  ```json
  {
    "id": "uuid-media",
    "storage_path": "reports/uuid-media.jpg",
    "mime_type": "image/jpeg"
  }
  ```

---

### `GET /api/v1/reports/{public_code}/status`
Consulta el estado de atención de una denuncia o reporte.
- **Query Params (opcional):** `?followup_code=PIN_SECRET`
- **Respuesta (200 OK):**
  ```json
  {
    "public_code": "LT-2026-000123",
    "report_type": "denuncia_anonima",
    "category_name": "Extorsión",
    "status": "en_atencion",
    "created_at": "2026-08-24T17:50:00Z",
    "history": [
      { "status": "pendiente", "created_at": "2026-08-24T17:50:00Z" },
      { "status": "en_atencion", "created_at": "2026-08-24T18:15:00Z", "public_note": "Unidad asignada para verificación" }
    ]
  }
  ```

---

### `GET /api/v1/report-categories`
Lista categorías activas para selección en formularios.
- **Query Params:** `?type=denuncia_anonima` (o `reporte_comunitario`)
- **Respuesta (200 OK):** Lista de categorías ordenadas por `sort_order`.

---

### `GET /api/v1/guides`
Lista guías educativas publicadas para el feed vertical.
- **Query Params:** `?category_slug=guias-rapidas&limit=20&offset=0`
- **Respuesta (200 OK):** Array de guías con URLs de video, miniaturas y metadatos.

---

### `GET /api/v1/guides/{slug}`
Obtiene el detalle completo y recursos anidados de una guía.

---

### `POST /api/v1/guides/{id}/view`
Registra una vista anónima (incrementa `view_count` y métricas diarias).

---

### `POST /api/v1/guides/{id}/helpful`
Registra una valoración de utilidad *"Me ayudó"* (incrementa `helpful_count`).

---

### `POST /api/v1/reports/{id}/share`
Registra un evento anónimo de difusión cívica.
- **Body:** `{ "platform": "whatsapp" }`

---

## 2. Módulo Policial y Administrativo (Autenticado)

### `POST /api/v1/auth/login`
Autenticación de personal de la comisaría. Retorna token JWT.

---

### `GET /api/v1/admin/reports`
Bandeja de reportes con filtros por estado, tipo, categoría, urgencia y rango de fechas.

---

### `GET /api/v1/admin/reports/{id}`
Detalle integral de reporte con URLs firmadas temporales para reproducción de evidencias multimedia.

---

### `PATCH /api/v1/admin/reports/{id}/status`
Actualiza el estado de un reporte e inserta registro en el historial.
- **Body:**
  ```json
  {
    "new_status": "en_atencion",
    "note": "Caso derivado al patrullero Sector 2"
  }
  ```

---

### `POST /api/v1/admin/reports/{id}/notes`
Agrega una nota o diligencia interna reservada.

---

### `GET /api/v1/admin/dashboard/summary`
KPIs operacionales para el cuadro de mando policial (reportes abiertos, tiempo promedio de respuesta, etc.).
