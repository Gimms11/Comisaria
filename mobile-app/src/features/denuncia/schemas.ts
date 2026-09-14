import { z } from 'zod';

export const step1CrimeSchema = z.object({
  category_id: z.string().min(1, 'Selecciona un tipo de delito'),
  description: z.string().min(8, 'Describe lo ocurrido con al menos 8 caracteres'),
  priority: z.enum(['baja', 'media', 'alta', 'urgente']),
  is_emergency: z.boolean(),
});

export const step2LocationSchema = z.object({
  address_reference: z.string().min(3, 'Ingresa una calle, avenida o punto de referencia'),
  location_note: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const step3EvidencePinSchema = z
  .object({
    pin: z.string().regex(/^$|^\d{6}$/, 'El PIN debe contener exactamente 6 dígitos numéricos o déjalo vacío'),
    confirm_pin: z.string().optional(),
    evidence_uri: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.pin && data.pin.length > 0) {
        return data.pin === data.confirm_pin;
      }
      return true;
    },
    {
      message: 'La confirmación del PIN no coincide con el PIN ingresado',
      path: ['confirm_pin'],
    }
  );

export type Step1CrimeForm = z.infer<typeof step1CrimeSchema>;
export type Step2LocationForm = z.infer<typeof step2LocationSchema>;
export type Step3EvidencePinForm = z.infer<typeof step3EvidencePinSchema>;
