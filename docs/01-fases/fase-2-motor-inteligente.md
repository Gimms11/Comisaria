# Fase 2 — Motor Inteligente + Seguridad Digital

**Objetivo:** Dotar a la plataforma de capacidades inteligentes, analíticas predictivas y herramientas de prevención activa para identificar patrones delictivos.

---

## 1. IA Conversacional para Clasificación de Denuncias

- **Asistente guiado:**
  - *"¿Qué pasó?"*
  - *"¿Dónde ocurrió?"*
  - *"¿Cuándo sucedió?"*
  - *"¿Hay personas heridas o en riesgo inmediato?"*
  - *"¿Es una emergencia en curso?"*
- **Clasificación automatizada:**
  - Robo / Hurto.
  - Extorsión.
  - Violencia familiar.
  - Sospechosos / Actividad sospechosa.
  - Reporte comunitario urbano.
- **Salida estructurada:** Generación automática de JSON enriquecido para optimizar la priorización y derivación en el panel policial.

---

## 2. Detección Inteligente de Emergencias

- Disparador automático si el texto, audio o respuestas indican riesgo inminente a la vida o integridad.
- **Acción inmediata:**
  - Banner prioritario: *"Llama ahora al 105"*.
  - Botón de llamada directa de un toque.
  - Advertencia clara: La app no reemplaza el despacho de emergencias en tiempo real.

---

## 3. Base de Datos Comunitaria de Números de Extorsión

- **Consulta ciudadana:** Buscador rápido: *"¿Te llamó este número?"*.
- **Reporte anónimo de números sospechosos:** Registro de número, modalidad y fecha.
- **Estados del número:**
  - `reportado`
  - `con_multiples_reportes`
  - `en_verificacion`
  - `confirmado_por_autoridad`
- **Regla de privacidad:** Aplicar máscara en consultas públicas si no hay confirmación oficial (ej. `999 *** 123`).

---

## 4. Mapa de Calor (Heatmap) y Prevención

- Visualización geoespacial de concentración de incidentes y denuncias.
- Filtros por rango de fechas, tipología delictiva y estado de atención.
- Herramienta estratégica para la asignación de patrullaje integrado (PNP + Serenazgo).

---

## 5. Analítica y Métricas de Impacto

- Reportes por categoría y sector vecinal.
- Incidencia por día de la semana y franja horaria.
- Guías de prevención más consultadas y valoradas.
- Reportes comunitarios con mayor difusión cívica.
