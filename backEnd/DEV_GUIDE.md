# Guía de Desarrollo Local con Docker

Instrucciones para levantar toda la infraestructura del backend en local sin dependencias de GCP.

---

## Prerrequisitos

- **Docker Desktop** instalado y corriendo.
- **Docker Compose** v2+ (incluido en Docker Desktop).
- Puertos disponibles: `5432`, `6379`, `8001-8004`, `9000-9001`.

---

## Mapa de Servicios

| Servicio | Puerto Local | Equivalente GCP | UI / Docs |
|---|---|---|---|
| PostgreSQL 16 | `5432` | Cloud SQL | — |
| Redis 7 | `6379` | Memorystore | — |
| MinIO (S3 local) | `9000` (API) / `9001` (Console) | Cloud Storage | http://localhost:9001 |
| MS-01 Gateway & Auth | `8001` | Cloud Run | http://localhost:8001/docs |
| MS-02 Denuncias Anónimas | `8002` | Cloud Run | http://localhost:8002/docs |
| MS-03 Reportes Ciudadanos | `8003` | Cloud Run | http://localhost:8003/docs |
| MS-04 Guías & Contenido | `8004` | Cloud Run | http://localhost:8004/docs |

---

## Arranque Rápido

```bash
# Desde backEnd/
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

Primera ejecución:
1. Docker construye las 4 imágenes (tarda ~2-4 min la primera vez).
2. PostgreSQL arranca y ejecuta automáticamente `schema.sql` + `seeds.sql`.
3. MinIO arranca y `minio-init` crea los 3 buckets.
4. Los 4 microservicios arrancan con **hot-reload** (Uvicorn `--reload`).

---

## Verificar que Todo Funciona

```bash
# Health checks
curl http://localhost:8001/healthz
curl http://localhost:8002/healthz
curl http://localhost:8003/healthz
curl http://localhost:8004/healthz

# Swagger UI de cada servicio
# Abrir en navegador:
#   http://localhost:8001/docs  (MS-01)
#   http://localhost:8002/docs  (MS-02)
#   http://localhost:8003/docs  (MS-03)
#   http://localhost:8004/docs  (MS-04)

# MinIO Console (usuario: minioadmin / pass: minioadmin123)
# Abrir: http://localhost:9001
```

---

## Hot-Reload en Desarrollo

Los volúmenes en Docker Compose montan el código fuente directamente:
- Editar archivos en `services/ms-XX/app/` → Uvicorn recarga automáticamente.
- Editar archivos en `packages/shared/` → Requiere reinicio del contenedor (`docker compose restart ms-01-gateway-auth`).

---

## Comandos Útiles

```bash
# Levantar todo en background
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build

# Ver logs de un servicio específico
docker compose -f docker-compose.dev.yml logs -f ms-01-gateway-auth

# Reiniciar solo un servicio
docker compose -f docker-compose.dev.yml restart ms-02-denuncias-anonimas

# Entrar a PostgreSQL
docker exec -it comisaria-postgres psql -U comisaria -d comisaria_db

# Entrar a Redis
docker exec -it comisaria-redis redis-cli

# Destruir todo (incluyendo volúmenes de datos)
docker compose -f docker-compose.dev.yml down -v

# Reconstruir sin caché
docker compose -f docker-compose.dev.yml build --no-cache
```

---

## Buckets de MinIO (Storage Local)

Al arrancar, `minio-init` crea automáticamente:

| Bucket | Acceso | Emula |
|---|---|---|
| `comisaria-evidencias-delitos` | Privado | `gs://comisaria-evidencias-delitos/` |
| `comisaria-reportes-urbanos` | Privado | `gs://comisaria-reportes-urbanos/` |
| `comisaria-guias-videos` | Público (download) | `gs://comisaria-guias-videos/` + CDN |

Acceso al console: http://localhost:9001 (user: `minioadmin` / pass: `minioadmin123`)

---

## Notas Importantes

- **Los secretos en `.env.dev` son solo para desarrollo local.** Nunca usar en producción.
- **PostgreSQL se inicializa automáticamente** con el schema y seeds del directorio `docs/03-base-de-datos/`. Si cambias el schema, destruye el volumen (`down -v`) y vuelve a levantar.
- **MinIO es S3-compatible**, así que `boto3` funciona igual que con GCS cuando se usa la capa de compatibilidad S3.
