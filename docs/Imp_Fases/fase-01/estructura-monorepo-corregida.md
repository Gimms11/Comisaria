# Estructura de Monorepo Backend Corregida (Post-Auditoría)

Estructura oficial después de aplicar las correcciones de la auditoría.

```text
backEnd/
├── docker-compose.dev.yml          # Orquestación local de TODO el backend
├── .env.dev                        # Variables de entorno para dev local
├── packages/
│   └── shared/                     # Librería compartida entre microservicios
│       ├── __init__.py
│       ├── database.py             # Sesión async SQLAlchemy + base declarativa
│       ├── security.py             # Argon2id (passwords), HMAC-SHA256 (followup codes), PyJWT
│       ├── config.py               # Pydantic BaseSettings compartida
│       ├── models/                 # Modelos ORM compartidos (una sola fuente de verdad)
│       │   ├── __init__.py
│       │   ├── officer.py          # officers
│       │   ├── report.py           # reports
│       │   ├── report_media.py     # report_media
│       │   ├── report_category.py  # report_categories
│       │   ├── status_history.py   # report_status_history
│       │   ├── share_event.py      # report_share_events
│       │   ├── guide.py            # guides
│       │   ├── guide_category.py   # guide_categories
│       │   ├── guide_resource.py   # guide_resources
│       │   └── guide_analytics.py  # guide_analytics_daily
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── enums.py            # ENUMs Python (officer_role, report_status, etc.)
│       ├── clients/
│       │   ├── __init__.py
│       │   └── broadcast_client.py # Cliente HTTP compartido para notificar a MS-01
│       └── alembic/                # Migraciones centralizadas (una sola fuente)
│           ├── alembic.ini
│           ├── env.py
│           └── versions/
├── services/
│   ├── ms-01-gateway-auth/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── config.py
│   │   │   │   └── dependencies.py
│   │   │   ├── schemas/
│   │   │   │   ├── auth.py
│   │   │   │   ├── officer.py
│   │   │   │   └── websocket.py
│   │   │   ├── services/
│   │   │   │   ├── auth_service.py
│   │   │   │   ├── ticket_service.py
│   │   │   │   └── ws_manager.py
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── router.py
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── officers.py
│   │   │   │   │   └── ws_police.py
│   │   │   │   └── internal/
│   │   │   │       └── broadcast.py
│   │   │   └── middlewares/
│   │   │       ├── rate_limiter.py
│   │   │       └── logging.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── ms-02-denuncias-anonimas/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── config.py
│   │   │   │   └── dependencies.py
│   │   │   ├── schemas/
│   │   │   │   ├── report.py
│   │   │   │   ├── media.py
│   │   │   │   └── category.py
│   │   │   ├── services/
│   │   │   │   ├── report_service.py
│   │   │   │   ├── media_sanitizer.py
│   │   │   │   └── storage_client.py
│   │   │   ├── api/v1/
│   │   │   │   ├── router.py
│   │   │   │   ├── public_reports.py
│   │   │   │   ├── categories.py
│   │   │   │   └── police_reports.py
│   │   │   └── middlewares/
│   │   │       └── privacy_headers.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── ms-03-reportes-ciudadanos/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── config.py
│   │   │   │   └── dependencies.py
│   │   │   ├── schemas/
│   │   │   │   ├── community_report.py
│   │   │   │   ├── share.py
│   │   │   │   └── web_preview.py
│   │   │   ├── services/
│   │   │   │   ├── community_service.py
│   │   │   │   ├── civic_sanitizer.py
│   │   │   │   └── civic_storage.py
│   │   │   ├── api/v1/
│   │   │   │   ├── router.py
│   │   │   │   ├── public_reports.py
│   │   │   │   ├── shares.py
│   │   │   │   ├── categories.py
│   │   │   │   └── police_reports.py
│   │   │   ├── templates/
│   │   │   │   └── og_preview.html
│   │   │   └── middlewares/
│   │   │       └── privacy_headers.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── ms-04-guias-contenido/
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── core/
│       │   │   ├── config.py
│       │   │   └── dependencies.py
│       │   ├── schemas/
│       │   │   ├── guide.py
│       │   │   ├── category.py
│       │   │   └── analytics.py
│       │   ├── services/
│       │   │   ├── guide_service.py
│       │   │   ├── content_storage.py
│       │   │   └── analytics_service.py
│       │   ├── api/v1/
│       │   │   ├── router.py
│       │   │   ├── public_guides.py
│       │   │   ├── categories.py
│       │   │   └── admin_guides.py
│       │   └── middlewares/
│       │       └── cache_headers.py
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt
```

## Cambios clave vs. estructura original:

1. **`packages/shared/models/`**: Todos los modelos ORM centralizados. Elimina duplicación entre MS-02 y MS-03.
2. **`packages/shared/clients/broadcast_client.py`**: Cliente HTTP compartido para MS-01. Elimina duplicación.
3. **`packages/shared/alembic/`**: Migraciones centralizadas para toda la BD.
4. **Sin `alembic/` individual** en cada servicio.
5. **Sin `models/` de tablas compartidas** en los servicios individuales; solo importan de `shared`.
