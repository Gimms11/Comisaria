# Plataforma de Apoyo Ciudadano - La Tinguiña

Plataforma cívica comunitaria y de seguridad ciudadana para el distrito de La Tinguiña. Permite denuncias anónimas sin registro obligatorio, reportes de incidentes urbanos, biblioteca de guías de prevención en formato vertical (estilo TikTok), y panel administrativo policial.

---

## 📁 Estructura Documental

- **[01. Fases del Sistema](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/01-fases/)**
  - [`01-fases/fase-1-mvp-civico.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/01-fases/fase-1-mvp-civico.md): Alcance MVP, denuncias anónimas, reportes cívicos, biblioteca digital y panel policial.
  - [`01-fases/fase-2-motor-inteligente.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/01-fases/fase-2-motor-inteligente.md): Clasificación con IA, detección de emergencias, BD de números de extorsión y mapas de calor.
  - [`01-fases/fase-3-tramites-digitales.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/01-fases/fase-3-tramites-digitales.md): Trámites documentales, mesa de partes virtual, autenticación e integración interinstitucional.

- **[02. Arquitectura y Flujos](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/02-arquitectura-y-flujos/)**
  - [`02-arquitectura-y-flujos/arquitectura-microservicios-gcp.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/02-arquitectura-y-flujos/arquitectura-microservicios-gcp.md): Topología de 4 microservicios en Cloud Run con aislamiento de storage, Cloud Armor y Redis.
  - [`02-arquitectura-y-flujos/flujo-denuncias-anonimas.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/02-arquitectura-y-flujos/flujo-denuncias-anonimas.md): Flujo de usuario y backend para denuncias anónimas exprés.
  - [`02-arquitectura-y-flujos/flujo-reportes-comunitarios.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/02-arquitectura-y-flujos/flujo-reportes-comunitarios.md): Reportes urbanos no criminales y generación de tarjetas para compartir.
  - [`02-arquitectura-y-flujos/flujo-biblioteca-tiktok.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/02-arquitectura-y-flujos/flujo-biblioteca-tiktok.md): Feed vertical educativo, categorías y accesibilidad UX.
  - [`02-arquitectura-y-flujos/pantallas-y-ux.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/02-arquitectura-y-flujos/pantallas-y-ux.md): Mapa de pantallas ciudadanas y panel policial.

- **[03. Base de Datos](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/03-base-de-datos/)**
  - [`03-base-de-datos/reglas-y-modelo.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/03-base-de-datos/reglas-y-modelo.md): Reglas de oro de privacidad, diagrama textual y descripción detallada de tablas.
  - [`03-base-de-datos/schema.sql`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/03-base-de-datos/schema.sql): DDL completo en PostgreSQL (tablas, ENUMs, triggers, índices).
  - [`03-base-de-datos/seeds.sql`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/03-base-de-datos/seeds.sql): Datos iniciales (categorías de denuncias, reportes comunitarios y guías).

- **[04. Seguridad y Privacidad](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/04-seguridad-y-privacidad/)**
  - [`04-seguridad-y-privacidad/politicas-seguridad.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/04-seguridad-y-privacidad/politicas-seguridad.md): Cero rastreo de identidad, sanitización EXIF, storage privado y control de acceso policial.

- **[05. API y Ciclo de Vida](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/05-api/)**
  - [`05-api/endpoints.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/05-api/endpoints.md): Especificación de endpoints para la app ciudadana y el panel administrativo.
  - [`05-api/estados-y-prioridades.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/05-api/estados-y-prioridades.md): Ciclo de estados de un reporte, prioridades y protocolo de llamada al 105.

- **[06. Stack y Roadmap](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/06-stack-y-siguientes-pasos/)**
  - [`06-stack-y-siguientes-pasos/tecnologia-y-roadmap.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/06-stack-y-siguientes-pasos/tecnologia-y-roadmap.md): Stack acordado (React Native Expo, FastAPI en Cloud Run, Cloud SQL, Redis, Buckets desacoplados, React SPA) y hoja de ruta.

- **[07. Planes de Implementación de Microservicios (Fase 1)](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/Imp_Fases/fase-01/)**
  - [`docs/Imp_Fases/fase-01/plan-ms-01-gateway-auth.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/Imp_Fases/fase-01/plan-ms-01-gateway-auth.md): MS-01 Gateway, Auth Policial, WebSockets Hub, Tickets efímeros y Broadcast.
  - [`docs/Imp_Fases/fase-01/plan-ms-02-denuncias-anonimas.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/Imp_Fases/fase-01/plan-ms-02-denuncias-anonimas.md): MS-02 Denuncias Anónimas, Sanitización EXIF, V4 Signed URLs y bucket privado de delitos.
  - [`docs/Imp_Fases/fase-01/plan-ms-03-reportes-ciudadanos.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/Imp_Fases/fase-01/plan-ms-03-reportes-ciudadanos.md): MS-03 Reportes Comunitarios, Tarjetas para Redes, OpenGraph y bucket cívico.
  - [`docs/Imp_Fases/fase-01/plan-ms-04-guias-contenido.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/Imp_Fases/fase-01/plan-ms-04-guias-contenido.md): MS-04 Biblioteca de Guías TikTok, Google Cloud CDN, Byte-Range streaming y analítica diaria.

- **[08. Despliegue en la Nube (GCP Serverless)](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/07-despliegue-cloud/)**
  - [`docs/07-despliegue-cloud/guia-despliegue-serverless-gcp.md`](file:///c:/Users/lordm/Desktop/Proyectos%20y%20clases/appMobile/Comisaria/docs/07-despliegue-cloud/guia-despliegue-serverless-gcp.md): Manual maestro de despliegue serverless ($0.00/mes), Scale-to-Zero en Cloud Run, Neon PostgreSQL, Cloud Storage (guardia de 4.99 GB), resolución de errores CORS/SSL/PIL y comandos de despliegue.

