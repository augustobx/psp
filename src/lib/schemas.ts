import { z } from "zod";

// --- VALIDACIONES DE CANCHAS Y HORARIOS ---

export const courtSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  sport: z.string().min(1, "El deporte es obligatorio"),
  isActive: z.boolean().default(true),
});

export const businessHourSchema = z.object({
  courtId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"),
  slotDuration: z.number().int().min(30).max(180),
}).refine((data) => {
  const open = parseInt(data.openTime.replace(":", ""));
  const close = parseInt(data.closeTime.replace(":", ""));
  return close > open || close === 0;
}, {
  message: "La hora de cierre debe ser posterior a la apertura",
  path: ["closeTime"],
});

// --- VALIDACIONES DE RESERVAS (CORREGIDO) ---

export const bookingSchema = z.object({
  courtId: z.string().uuid("Cancha inválida"),
  userId: z.string().uuid("Usuario inválido"), // Agregado para el build
  totalPrice: z.coerce.number().positive("Precio inválido"), // Agregado para el build
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine((data) => data.endTime > data.startTime, {
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["endTime"],
});

export const fixedBookingSchema = z.object({
  courtId: z.string().uuid(),
  userId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: "La fecha de fin del abono debe ser posterior al inicio",
  path: ["endDate"],
});

export const courtBlockSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  reason: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: "La hora de fin del bloqueo debe ser posterior a la de inicio",
  path: ["endTime"],
});

// --- TIPOS INFERIDOS ---
export type CourtInput = z.infer<typeof courtSchema>;
export type BusinessHourInput = z.infer<typeof businessHourSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type FixedBookingInput = z.infer<typeof fixedBookingSchema>;
export type CourtBlockInput = z.infer<typeof courtBlockSchema>;