import { z } from 'zod';

// ==========================================
// 1. AUTENTICACIÓN (LOGIN)
// ==========================================
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese una dirección de correo válida (ej: oficial@policia.gob.pe)'),
  password: z
    .string()
    .min(1, 'La contraseña de acceso es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// 2. GESTIÓN DE OFICIALES (MS-01)
// ==========================================
export const officerCreateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-]+$/, 'El nombre solo debe contener letras, puntos o guiones'),
  email: z
    .string()
    .trim()
    .min(1, 'El correo institucional es obligatorio')
    .email('Ingrese un correo institucional válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Debe contener al menos un número o carácter especial'),
  role: z.enum(['admin', 'comisario', 'operador', 'moderador'], {
    message: 'Seleccione un rol institucional válido',
  }),
});

export type OfficerCreateFormData = z.infer<typeof officerCreateSchema>;

// ==========================================
// 3. GUÍAS CÍVICAS (MS-04)
// ==========================================
export const guideCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150, 'El título no puede superar los 150 caracteres'),
  summary: z
    .string()
    .trim()
    .min(10, 'El resumen y pasos clave deben tener al menos 10 caracteres')
    .max(3000, 'El contenido no puede superar los 3000 caracteres'),
  category_id: z.string().optional(),
  content_type: z.enum(['video', 'articulo', 'infografia', 'mixto']).default('video'),
  main_video_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i.test(val),
      { message: 'Ingrese una URL válida (ej: https://www.tiktok.com/@... o https://vm.tiktok.com/...)' }
    ),
  thumbnail_url: z.string().optional(),
  transcript: z.string().optional(),
  is_featured: z.boolean().default(false),
});

export type GuideCreateFormData = z.infer<typeof guideCreateSchema>;

export const guideEditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(150, 'El título no puede superar los 150 caracteres'),
  summary: z
    .string()
    .trim()
    .min(10, 'El resumen debe tener al menos 10 caracteres')
    .max(3000, 'El resumen no puede superar los 3000 caracteres'),
  category_id: z.string().optional(),
  main_video_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i.test(val),
      { message: 'Ingrese una URL válida (ej: https://www.tiktok.com/@...)' }
    ),
});

export type GuideEditFormData = z.infer<typeof guideEditSchema>;

export const guideResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'El nombre del recurso debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede superar los 150 caracteres'),
  resource_type: z.enum(['enlace', 'imagen', 'texto'], {
    message: 'Seleccione un tipo de recurso válido',
  }),
  external_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i.test(val),
      { message: 'Ingrese una URL válida que empiece con http:// o https://' }
    ),
  body: z.string().optional(),
});

export type GuideResourceFormData = z.infer<typeof guideResourceSchema>;

// ==========================================
// 4. TRANSICIONES DE MÁQUINA DE ESTADO (WORKFLOW)
// ==========================================
export interface TransitionValidationOptions {
  minNoteLength: number;
  requiresEvidence: boolean;
  requiresDestination: boolean;
}

export const createWorkflowTransitionSchema = (options: TransitionValidationOptions) => {
  return z.object({
    note: z
      .string()
      .trim()
      .min(
        options.minNoteLength,
        options.minNoteLength === 1
          ? 'La nota de constancia es obligatoria'
          : `La nota de constancia debe tener al menos ${options.minNoteLength} caracteres`
      )
      .max(1000, 'La nota no puede superar los 1000 caracteres'),
    destination_entity: options.requiresDestination
      ? z
          .string()
          .trim()
          .min(1, 'Debe seleccionar o especificar la entidad de destino')
      : z.string().optional(),
    document_number: z
      .string()
      .trim()
      .max(100, 'El N° de Oficio o Documento no puede superar los 100 caracteres')
      .optional(),
    files: options.requiresEvidence
      ? z
          .array(z.custom<File>())
          .min(1, 'Debe adjuntar al menos una fotografía como constancia de la resolución')
          .refine(
            (files) => files.every((f) => f.size <= 20 * 1024 * 1024),
            'Ningún archivo individual puede superar los 20MB'
          )
      : z.array(z.custom<File>()).optional(),
  });
};

// ==========================================
// 5. NOTAS CONFIDENCIALES PNP
// ==========================================
export const internalNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, 'La nota interna debe tener al menos 3 caracteres')
    .max(500, 'La nota interna no puede superar los 500 caracteres'),
});

export type InternalNoteFormData = z.infer<typeof internalNoteSchema>;

// ==========================================
// HELPER: FORMATTEADOR DE ERRORES ZOD
// ==========================================
export const formatZodErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    } else if (!path && !errors['_global']) {
      errors['_global'] = issue.message;
    }
  }
  return errors;
};

