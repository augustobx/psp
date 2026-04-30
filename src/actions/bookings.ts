'use server';

import { prisma } from '@/lib/prisma';
import { bookingSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createBooking(data: unknown) {
  const result = bookingSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  // Ahora el desestructurado funciona porque el esquema tiene userId y totalPrice
  const { courtId, startTime, endTime, userId, totalPrice } = result.data;

  try {
    // 1. Verificar superposición
    const overlapping = await prisma.booking.findFirst({
      where: {
        courtId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: endTime, gte: startTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } }
        ]
      }
    });

    if (overlapping) {
      return { success: false, error: 'La cancha ya está reservada en ese horario.' };
    }

    // 2. Crear Reserva
    const booking = await prisma.booking.create({
      data: {
        userId,
        courtId,
        startTime,
        endTime,
        totalPrice,
        status: 'PENDING'
      }
    });

    revalidatePath('/reservas');
    revalidatePath('/admin/calendar');

    return { success: true, booking };
  } catch (error) {
    console.error('Error creando reserva:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getAvailableSlots(courtId: string, date: string) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      courtId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startTime: { gte: targetDate, lt: nextDay }
    }
  });

  const slots = [];
  for (let i = 8; i <= 22; i++) {
    const slotStart = new Date(targetDate);
    slotStart.setHours(i, 0, 0, 0);
    const slotEnd = new Date(targetDate);
    slotEnd.setHours(i + 1, 0, 0, 0);

    const isBooked = bookings.some(b =>
      (b.startTime < slotEnd && b.endTime > slotStart)
    );

    if (!isBooked) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      });
    }
  }

  return slots;
}