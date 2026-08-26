# Auditoría de Planes de Implementación — Fase 1

Revisión cruzada de los 4 planes de microservicios contra el schema SQL, la arquitectura de microservicios GCP y las decisiones de stack tomadas.

---

## Hallazgos y Correcciones

### 🔴 Errores Críticos

#### 1. MS-01: Alembic por servicio individual es incoherente con BD compartida
**Problema:** El plan de MS-01 coloca una carpeta `alembic/` dentro de `ms-01-gateway-auth/` indicando migraciones solo para `officers`. Pero los 4 microservicios comparten **la misma instancia de Cloud SQL**. Si cada servicio corre sus propias migraciones, habrá conflictos de versiones y estados inconsistentes.  
**Corrección:** Mover Alembic a `backEnd/packages/shared/` como fuente única de verdad para todas las migraciones. Un solo historial de versiones con todas las tablas (`officers`, `reports`, `report_media`, `guides`, etc.). Solo se ejecuta desde un punto centralizado, no desde cada servicio.

#### 2. MS-01: `python-jose` está deprecado
**Problema:** `requirements.txt` lista `python-jose` para JWT. Esta librería está abandonada desde 2022 y tiene CVEs abiertos.  
**Corrección:** Usar `PyJWT` (paquete `pyjwt[crypto]`), activamente mantenido.

#### 3. MS-02: Inconsistencia en hash de `followup_code_hash`
**Problema:** El plan dice "SHA-256 / bcrypt" indistintamente. bcrypt para PIN de seguimiento es innecesariamente lento (diseñado para passwords); SHA-256 no tiene salt. Ninguno es ideal.  
**Corrección:** Usar **HMAC-SHA256 con clave secreta del servidor** (rápido, con salt implícito vía key, resistente a rainbow tables). Para passwords de oficiales, Argon2id se mantiene.

#### 4. MS-02 y MS-03: Modelos SQLAlchemy duplicados para la misma tabla `reports`
**Problema:** MS-02 define `report.py` (modelo `Report`) y MS-03 define `community_report.py` mapeando la **misma tabla** `reports` con `report_type` distinto. Dos modelos ORM apuntando a la misma tabla en memoria genera conflictos en el metadata registry de SQLAlchemy.  
**Corrección:** El modelo `Report` y `ReportMedia` viven en `packages/shared/models/`. Cada microservicio importa los modelos compartidos y solo añade queries/services específicos de su dominio.

---

### 🟡 Inconsistencias Menores

#### 5. MS-02: Devuelve `report_id` al ciudadano anónimo
**Problema:** El endpoint `POST /reports` retorna `{ public_code, report_id, status }`. Entregar el `report_id` (UUID interno) al público permite ataques de enumeración sobre endpoints policiales como `GET /police/reports/{id}`.  
**Corrección:** El ciudadano solo recibe `{ public_code, status, created_at }`. Los endpoints de subida de multimedia usan `public_code` (no UUID interno).

#### 6. MS-01: Cloud Run no mantiene conexiones WebSocket indefinidamente
**Problema:** Cloud Run tiene un timeout máximo de request de 60 minutos (configurable hasta ese límite). Los WebSockets del panel policial necesitan conexiones persistentes durante turnos de 8+ horas.  
**Corrección:** En Docker local no importa. Para producción: configurar `--timeout=3600` en Cloud Run + implementar reconexión automática con exponential backoff en el cliente web. Agregar nota en el plan.

#### 7. MS-02: Falta secuencia PostgreSQL en `schema.sql`
**Problema:** El plan describe generación atómica de `public_code` vía `nextval('seq_reports_public_code')`, pero el `schema.sql` no incluye esta secuencia.  
**Corrección:** Agregar la secuencia al schema SQL.

#### 8. MS-03: Bucket descrito como "público" pero las fotos de reportes urbanos también necesitan sanitización
**Problema:** El plan llama al bucket `gs://comisaria-reportes-urbanos/` "Público" pero las fotos de baches/postes pueden contener EXIF del denunciante. Si el bucket fuera público directo, los metadatos EXIF quedarían expuestos.  
**Corrección:** Aclarar que el bucket es de **acceso restringido con URLs firmadas públicas** (no acceso público abierto `allUsers`). La sanitización EXIF sigue siendo obligatoria.

#### 9. MS-04: `DELETE /admin/guides/{id}` debería ser soft-delete
**Problema:** Un `DELETE` real borra datos de analítica vinculados (`guide_analytics_daily` con `ON DELETE CASCADE`). Se pierde data histórica.  
**Corrección:** Marcar `is_published = false` + campo `archived_at`. No eliminar registros.

#### 10. Todos: Falta `broadcast_client.py` compartido
**Problema:** MS-02 y MS-03 ambos definen un `broadcast_client.py` con la misma lógica (HTTP POST a MS-01 con `X-Internal-Service-Key`). Código duplicado.  
**Corrección:** Mover `broadcast_client.py` a `packages/shared/clients/`.

---

## Resumen de Correcciones Aplicadas

| # | Problema | Acción |
|---|---|---|
| 1 | Alembic duplicado por servicio | Centralizar en `packages/shared/alembic/` |
| 2 | `python-jose` deprecado | Reemplazar por `pyjwt[crypto]` |
| 3 | Hash de followup_code inconsistente | HMAC-SHA256 con clave de servidor |
| 4 | Modelos ORM duplicados para `reports` | Modelos en `packages/shared/models/` |
| 5 | UUID interno expuesto al ciudadano | Solo retornar `public_code` |
| 6 | WS timeout en Cloud Run | Reconexión automática + `--timeout=3600` |
| 7 | Secuencia de `public_code` faltante | Agregar `CREATE SEQUENCE` al schema |
| 8 | Bucket urbano erróneamente público | Acceso restringido + URLs firmadas |
| 9 | DELETE real borra analítica | Soft-delete con `archived_at` |
| 10 | `broadcast_client.py` duplicado | Mover a `packages/shared/clients/` |
