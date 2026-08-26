# Fase 1 — MVP Cívico + Biblioteca Digital

**Objetivo:** Lanzar rápido una app útil, fácil de usar, sin registro obligatorio y con foco primordial en la confianza ciudadana y el anonimato.

---

## 1. Denuncias Anónimas Exprés

- **Sin login:** No requiere credenciales ni datos personales.
- **Formulario en 3 pasos:**
  1. ¿Qué pasó? (Descripción y categoría).
  2. ¿Dónde pasó? (Ubicación en mapa o referencia escrita).
  3. Evidencia opcional (Foto, video corto o audio).
- **Código de seguimiento anónimo:** Identificador único público (ej. `LT-2026-000123`) y hash de código secreto opcional.
- **Protección de identidad:** Eliminación automática de metadatos EXIF y geolocalización embebida en archivos.

---

## 2. Reportes Comunitarios No Criminales

Atención y visibilización de problemas urbanos o vecinales del distrito:
- Baches y pistas deterioradas.
- Postes o alumbrado público dañado/apagado.
- Basura acumulada o focos infecciosos.
- Desagües colapsados.
- Señalización vial deteriorada.
- Espacios públicos inseguros o abandonados.

**Difusión cívica:**
- Capacidad de compartir el reporte en redes sociales o WhatsApp.
- Tarjeta visual generada automáticamente sin exponer datos personales del denunciante.

---

## 3. Biblioteca Digital de Guías Estilo TikTok

- **Formato:** Videos verticales cortos (30 a 60 seg) acompañados de transcripción y pasos breves en texto.
- **Categorías clave:**
  - Cómo denunciar de forma segura.
  - Violencia familiar.
  - Extorsión telefónica y qué hacer ante amenazas.
  - Robo y hurto.
  - Pérdida de documentos.
  - Seguridad digital y prevención de estafas.
  - Trámites básicos de comisaría.
- **Interfaz:** Feed vertical simple de navegación fluida, diseñado para todas las edades.

---

## 4. Panel Básico para la Comisaría

- **Bandeja de reportes:** Listado filtrable por tipo, fecha, categoría y estado.
- **Gestión de estados:**
  - `pendiente`
  - `en_revision`
  - `en_atencion`
  - `derivado`
  - `resuelto`
  - `archivado`
  - `rechazado`
- **Vista de detalle:** Consulta de descripción, ubicación georreferenciada, notas internas y evidencia en storage seguro.
- **Mapa básico:** Visualización de incidentes reportados en el distrito.

---

## 5. Privacidad desde el Diseño (Privacy by Design)

- No recolectar nombre, DNI, correo electrónico ni número de teléfono para denuncias anónimas.
- No persistir dirección IP del denunciante.
- Sanitización estricta de metadatos en archivos multimedia.
- Acceso restringido por roles (`admin`, `comisario`, `operador`, `moderador`) en el panel policial.

---

## Resultado Esperado

> "Entrar, reportar, recibir un código anónimo, y que la comisaría pueda revisar el caso sin pedir datos personales."
