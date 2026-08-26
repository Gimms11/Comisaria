# Flujo de la Biblioteca Digital (Estilo TikTok)

Módulo de educación y prevención ciudadana basado en microcontenidos audiovisuales verticales orientados a un consumo ágil y accesible para toda la población.

---

## 1. Arquitectura de Navegación

- **Feed Vertical Continuo:** Deslizamiento vertical (swipe up/down) para avanzar entre guías de prevención.
- **Superposiciones de Interacción (Overlay):**
  - Botón *"Me ayudó"* (incrementa `helpful_count` de manera anónima).
  - Botón *"Compartir"* (enlace directo o video).
  - Botón *"Ver pasos / Transcripción"* (abre tarjeta inferior / bottom-sheet con el texto paso a paso).
  - Selector superior de categorías.

---

## 2. Categorías Principales

1. **Guías Rápidas:** Instrucciones en menos de 45 segundos para acciones inmediatas.
2. **Seguridad Ciudadana:** Prevención de robos en vía pública, comercio y vivienda.
3. **Violencia Familiar:** Rutas de auxilio, líneas de protección y medidas cautelares.
4. **Extorsión y Llamadas:** Protocolos ante llamadas amenazantes, préstamos gota a gota.
5. **Trámites y Documentos:** Procedimientos ante pérdida de DNI, placas o documentos de identidad.

---

## 3. Principios de Accesibilidad y UX

Diseñado específicamente considerando a adultos mayores o usuarios con baja familiaridad digital:

- **Tipografía escalable y contrastes altos:** Textos grandes con subtitulado sincronizado.
- **Acceso multimodal:** Opción para reproducir audio narrado o leer en modo simple.
- **Lenguaje libre de tecnicismos jurídicos:** Redacción clara, empática y orientada a la acción.
- **Tiempos de carga mínimos:** Almacenamiento CDN y compresión optimizada en H.264/WebM.
