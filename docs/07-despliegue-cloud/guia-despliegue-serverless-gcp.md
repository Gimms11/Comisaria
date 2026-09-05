# Guía de Despliegue Serverless en Google Cloud Platform (Capa Gratuita)

Este documento detalla la arquitectura, configuración, variables de entorno, problemas técnicos resueltos y el procedimiento de despliegue del backend de la **Plataforma de Apoyo Ciudadano - Comisaría La Tinguiña** en Google Cloud Platform (GCP).

---

## 1. Resumen Ejecutivo de la Infraestructura ($0.00 / mes)

El sistema opera bajo un modelo **100% Serverless con Scale-to-Zero**, diseñado para mantenerse dentro de los límites de la capa gratuita permanente de Google Cloud y proveedores asociados.

| Componente | Nube / Proveedor | Servicio | Configuración de Costo $0 | Estado |
|---|---|---|---|---|
| **Cómputo Backend** | Google Cloud Platform | **Cloud Run** (`us-central1`) | `--min-instances 0` (Scale to Zero), `--max-instances 2`, 256M/512M RAM. Cubierto por 2M peticiones/mes gratis. | **PRODUCCIÓN (100% Tráfico)** |
| **Base de Datos** | Neon Serverless | **PostgreSQL 16** | Free Tier (0.5 GB almacenamiento, pool de conexiones SSL `asyncpg`). | **MIGRADO Y ACTIVO** |
| **Storage Multimedia** | Google Cloud Platform | **Cloud Storage (GCS)** | 3 Buckets en `us-central1` (5 GB/mes gratis). Guardia estricta de **4.99 GB** en código. | **PRODUCCIÓN** |
| **Caché / Broadcast** | Backend Local / Memoria | **In-Memory Fallback** | Fallback nativo en memoria para tickets efímeros de WebSockets sin costo de Memorystore. | **ACTIVO** |
| **Integración TikTok** | RapidAPI | **TikTok Video No-Watermark** | API Key inyectada para resolver, descargar y almacenar videos cívicos en GCS. | **ACTIVO** |
| **CI / CD Images** | Google Cloud Platform | **Cloud Build & Artifact Registry** | 120 minutos de compilación diarios gratis. | **CONFIGURADO** |

---

## 2. Microservicios Desplegados (Endpoints y Swagger)

Los cuatro microservicios cuentan con certificados SSL gestionados por Google y endpoints OpenAPI Swagger interactivos:

### MS-01: Gateway, Autenticación y WebSocket Hub
- **Service Name:** `comisaria-ms01-auth`
- **Base URL:** [https://comisaria-ms01-auth-264198079598.us-central1.run.app](https://comisaria-ms01-auth-264198079598.us-central1.run.app)
- **Documentación Swagger:** [https://comisaria-ms01-auth-264198079598.us-central1.run.app/docs](https://comisaria-ms01-auth-264198079598.us-central1.run.app/docs)
- **Responsabilidad:** Autenticación de efectivos policiales (JWT), RBAC, emisión de tickets efímeros y distribución de alertas en tiempo real vía WebSocket (`wss://`).

### MS-02: Denuncias Anónimas de Delitos
- **Service Name:** `comisaria-ms02-denuncias`
- **Base URL:** [https://comisaria-ms02-denuncias-264198079598.us-central1.run.app](https://comisaria-ms02-denuncias-264198079598.us-central1.run.app)
- **Documentación Swagger:** [https://comisaria-ms02-denuncias-264198079598.us-central1.run.app/docs](https://comisaria-ms02-denuncias-264198079598.us-central1.run.app/docs)
- **Bucket GCS:** `gs://comisaria-evidencias-mitrufely`
- **Responsabilidad:** Ingesta de denuncias anónimas, generación de código público y PIN de seguimiento, sanitización de metadatos EXIF y guardia de almacenamiento de 4.99 GB.

### MS-03: Reportes Comunitarios y Vecinales
- **Service Name:** `comisaria-ms03-reportes`
- **Base URL:** [https://comisaria-ms03-reportes-264198079598.us-central1.run.app](https://comisaria-ms03-reportes-264198079598.us-central1.run.app)
- **Documentación Swagger:** [https://comisaria-ms03-reportes-264198079598.us-central1.run.app/docs](https://comisaria-ms03-reportes-264198079598.us-central1.run.app/docs)
- **Bucket GCS:** `gs://comisaria-reportes-mitrufely`
- **Responsabilidad:** Registro de incidencias urbanas (baches, alumbrado, basura), generación de tarjetas sociales OpenGraph y derivaciones.

### MS-04: Guías Ciudadanas & Micro-videos TikTok
- **Service Name:** `comisaria-ms04-guias`
- **Base URL:** [https://comisaria-ms04-guias-264198079598.us-central1.run.app](https://comisaria-ms04-guias-264198079598.us-central1.run.app)
- **Documentación Swagger:** [https://comisaria-ms04-guias-264198079598.us-central1.run.app/docs](https://comisaria-ms04-guias-264198079598.us-central1.run.app/docs)
- **Bucket GCS:** `gs://comisaria-guias-mitrufely`
- **Responsabilidad:** Catálogo de orientación cívica, descarga y persistencia de videos educativos de TikTok vía RapidAPI, streaming y recursos descargables.

---

## 3. Configuración de Variables de Entorno en Cloud Run

Cada microservicio fue configurado con las siguientes variables de entorno:

| Variable | Valor / Descripción | Microservicios |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://<USER>:<PASSWORD>@<HOST>/<DB>?ssl=require` | MS-01, MS-02, MS-03, MS-04 |
| `JWT_SECRET_KEY` | `comisaria-tinguina-jwt-secret-2026-prod` | MS-01, MS-02, MS-03, MS-04 |
| `INTERNAL_SERVICE_KEY` | `comisaria-internal-key-2026-prod` | MS-01, MS-02, MS-03, MS-04 |
| `FOLLOWUP_HMAC_KEY` | `comisaria-hmac-followup-key-2026-prod` | MS-01, MS-02, MS-03, MS-04 |
| `MS01_INTERNAL_URL` | `https://comisaria-ms01-auth-264198079598.us-central1.run.app` | MS-02, MS-03, MS-04 |
| `STORAGE_BUCKET` | Nombre del bucket GCS respectivo (`comisaria-*-mitrufely`) | MS-02, MS-03, MS-04 |
| `STORAGE_PUBLIC_URL` | `https://storage.googleapis.com` | MS-04 |
| `REDIS_URL` | `redis://localhost:6379/0` (activa fallback en memoria) | MS-01, MS-02, MS-03, MS-04 |
| `TIKTOK_API_KEY` | Clave RapidAPI para resolución de videos | MS-01, MS-02, MS-03, MS-04 |
| `CORS_ORIGINS` | `*` (permite consumir desde localhost, Vercel, Firebase o producción) | MS-01, MS-02, MS-03, MS-04 |

---

## 4. Configuración del Frontend (`frontEnd/.env`)

Para conectar la interfaz web React/Vite con el backend en la nube:

```env
VITE_MS01_URL=https://comisaria-ms01-auth-264198079598.us-central1.run.app
VITE_MS02_URL=https://comisaria-ms02-denuncias-264198079598.us-central1.run.app
VITE_MS03_URL=https://comisaria-ms03-reportes-264198079598.us-central1.run.app
VITE_MS04_URL=https://comisaria-ms04-guias-264198079598.us-central1.run.app
```

- El WebSocket Hub transforma automáticamente `https://` en `wss://` para la suscripción a alertas policiales.

---

## 5. Credenciales Iniciales de Oficiales PNP

Los oficiales iniciales creados en la base de datos cuentan con contraseñas de desarrollo asignadas en la inicialización:

**Contraseña para cuentas de desarrollo:** `<PASSWORD_CONFIGURADA>`

| Nombre | Correo Electrónico | Rol | Permisos |
|---|---|---|---|
| **Comisario Mayor Admin** | `admin@tinguina.pnp.gob.pe` | `admin` | Acceso total al panel, gestión de oficiales, denuncias, reportes y guías |
| **Administrador General PNP** | `admin@comisaria.gob.pe` | `admin` | Acceso total administrativo |
| **Mayor PNP Comisario** | `comisario.tinguina@policia.gob.pe` | `comisario` | Supervisión y reasignación de denuncias |
| **Suboficial Operador** | `operador@tinguina.pnp.gob.pe` | `operador` | Atención de denuncias e incidencias de guardia |
| **Lic. Moderador Comunitario**| `moderador.comunitario@policia.gob.pe` | `moderador` | Gestión de incidencias vecinales y guías cívicas |

---

## 6. Problemas Técnicos Encontrados y Soluciones Implementadas

### A. Error de Preflight CORS por Redirección 307 detrás de Reverse Proxy
- **Síntoma:** Al invocar endpoints como `POST /api/v1/admin/guides`, el navegador arrojaba:
  `Response to preflight request doesn't pass access control check: Redirect is not allowed for a preflight request.` (Redirección de `https://` a `http://`).
- **Causa Raíz:** 
  1. FastAPI define rutas con trailing slash (`/`), por lo que peticiones sin slash emitían un `307 Temporary Redirect`.
  2. Al estar detrás del balanceador de Cloud Run (terminador TLS), FastAPI recibía la petición interna vía HTTP y generaba una cabecera `Location: http://...`, lo que provocaba un downgrade de protocolo prohibido por los navegadores.
- **Solución Aplicada:**
  1. En todos los microservicios se añadió `ProxyHeadersMiddleware(trusted_hosts="*")` en FastAPI y `--forwarded-allow-ips='*'` en Gunicorn para leer `X-Forwarded-Proto: https`.
  2. En todos los routers de colecciones se registraron alias para ambas variantes (`@router.post("")` y `@router.post("/")`), eliminando el 307 redirect en su origen.
  3. En `frontEnd/src/services/api.ts` se normalizaron todas las llamadas con slash explícito.

### B. Fallo de Arranque por Dependencia Opcional de Pillow (`ModuleNotFoundError: No module named 'PIL'`)
- **Síntoma:** El microservicio `ms-01` crasheaba en el arranque con error 503 (`Reason: Worker failed to boot`), perdiendo las cabeceras CORS en el login.
- **Causa Raíz:** `packages.shared.models.officer` importaba indirectamente `media_validator.py` a través de `packages.shared.schemas.__init__`, donde existía una importación no defensiva de `from PIL import Image`.
- **Solución Aplicada:**
  1. Se implementó una importación defensiva `try...except ImportError` en `media_validator.py`.
  2. Se añadió `Pillow` y `libjpeg62-turbo-dev` explícitamente en el Dockerfile y `requirements.txt` de `ms-01` y `ms-04`.
  3. Se recompiló la imagen de `ms-01` en Cloud Build y se desplegó una nueva revisión.

### C. Error 400 en Creación de Guías con Video de TikTok
- **Síntoma:** Al subir una guía cívica con URL de TikTok, el servidor respondía `HTTP 400 Bad Request`.
- **Causa Raíz:** `tiktok_downloader.py` requería la variable `TIKTOK_API_KEY` para interactuar con RapidAPI. Al no estar presente en las variables de Cloud Run, lanzaba `ValueError("TIKTOK_API_KEY no está configurada en el backend.")`.
- **Solución Aplicada:**
  1. Se agregó `TIKTOK_API_KEY` en `packages/shared/config.py`.
  2. Se inyectó la clave en las revisiones de Cloud Run junto con `STORAGE_PUBLIC_URL=https://storage.googleapis.com`.

### D. Error `net::ERR_NAME_NOT_RESOLVED` en Videos Iniciales
- **Síntoma:** La pestaña de guías intentaba reproducir `https://cdn.tuapp.pe/guias/...`, fallando por dominio inexistente.
- **Causa Raíz:** Registros iniciales insertados por `seeds.sql` tenían URLs mock de prueba.
- **Solución Aplicada:** Se actualizaron los registros en la base de datos Neon hacia videos de prueba reproducibles alojados en Google Cloud Storage y miniaturas de Unsplash.

### E. Guardia de Capa Gratuita de Almacenamiento (4.99 GB)
- **Implementación:** Tanto en `ms-02` (`report_service.py`) como en `ms-03` (`community_service.py`), antes de subir cualquier archivo multimedia a GCS se ejecuta:
  ```python
  total_bytes = await db.scalar(select(func.coalesce(func.sum(ReportMedia.size_bytes), 0)))
  if total_bytes + file_size > 4.99 * 1024 * 1024 * 1024:
      raise ValueError("Límite de almacenamiento gratuito alcanzado (4.99 GB). No se pueden adjuntar más archivos.")
  ```
  Esto garantiza que el proyecto nunca incurra en costos adicionales en Google Cloud Storage.

---

## 7. Scripts y Comandos de Compilación y Despliegue

### Compilación de Imágenes en Google Cloud Build
Archivos de configuración creados en el directorio `backEnd/`:
- `cloudbuild_ms01.yaml`
- `cloudbuild_ms02.yaml`
- `cloudbuild_ms03.yaml`
- `cloudbuild_ms04.yaml`

Comando manual para compilar cualquier servicio:
```powershell
gcloud builds submit --config cloudbuild_ms01.yaml --project mitrufely .
```

### Despliegue de un Servicio a Cloud Run (Ejemplo MS-01)
```powershell
gcloud run deploy comisaria-ms01-auth `
  --image us-central1-docker.pkg.dev/mitrufely/mifrufely-repo/comisaria-ms01:latest `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --min-instances 0 `
  --max-instances 2 `
  --memory 256Mi `
  --cpu 1 `
  --timeout 300 `
  --set-env-vars "DATABASE_URL=postgresql+asyncpg://neondb_owner:<DB_PASSWORD>@<DB_HOST>/neondb?ssl=require,JWT_SECRET_KEY=comisaria-tinguina-jwt-secret-2026-prod,INTERNAL_SERVICE_KEY=comisaria-internal-key-2026-prod,FOLLOWUP_HMAC_KEY=comisaria-hmac-followup-key-2026-prod,REDIS_URL=redis://localhost:6379/0,CORS_ORIGINS=*,TIKTOK_API_KEY=<TU_RAPIDAPI_TIKTOK_KEY>" `
  --project mitrufely
```

### Actualización Inmediata de Variables de Entorno
```powershell
gcloud run services update comisaria-ms04-guias `
  --update-env-vars "TIKTOK_API_KEY=<TU_RAPIDAPI_TIKTOK_KEY>,STORAGE_PUBLIC_URL=https://storage.googleapis.com" `
  --region us-central1 `
  --project mitrufely
```

### Despliegue de los Microservicios
Cada servicio se despliega mediante `gcloud run deploy` apuntando a su respectivo contenedor compilado en Artifact Registry.

