import { z } from 'zod';

export const CourtSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.string().min(2, "Tipo es requerido"),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'INACTIVE']).default('AVAILABLE'),
});

export const BookingSchema = z.object({
  userId: z.string().uuid(),
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  totalPrice: z.number().positive(),
});

export const TournamentSchema = z.object({
  name: z.string().min(3),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const PaymentSchema = z.object({
  bookingId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
});

export const ExpenseSchema = z.object({
  description: z.string().min(3),
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  category: z.string(),
});
