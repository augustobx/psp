'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Obtener reservas por día (Para el Panel de Admin)
export async function getBookingsByDate(dateStr: string) {
  try {
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        court: true,
        user: true,
      },
      orderBy: [
        { courtId: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: 'Error al cargar las reservas del día.' };
  }
}

// 2. Obtener turnos disponibles (Para el Frontend Público)
export async function getAvailableSlots(courtId: string, dateStr: string) {
  try {
    const targetDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    // Buscar si la cancha abre ese día
    const businessHour = await prisma.businessHour.findFirst({
      where: { courtId, dayOfWeek }
    });

    if (!businessHour) return { success: true, data: [] }; // No abre

    // Buscar reservas existentes para no sobreescribir
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' }
      }
    });

    // Calcular la grilla de turnos
    const slots: string[] = [];
    const [openHour, openMin] = businessHour.openTime.split(':').map(Number);
    const [closeHour, closeMin] = businessHour.closeTime.split(':').map(Number);

    let currentMinutes = openHour * 60 + openMin;
    const endMinutes = closeHour * 60 + closeMin;
    const duration = businessHour.slotDuration;
    const now = new Date();

    while (currentMinutes + duration <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const slotStartMin = (currentMinutes % 60).toString().padStart(2, '0');
      const timeString = `${slotStartHour}:${slotStartMin}`;

      const slotStartTime = new Date(`${dateStr}T${timeString}:00`);

      // Verificar si el turno ya está ocupado
      const isOccupied = existingBookings.some(booking => {
        return new Date(booking.startTime).getTime() === slotStartTime.getTime();
      });

      // Solo mostramos turnos que no están ocupados y que son en el futuro
      if (!isOccupied && slotStartTime > now) {
        slots.push(timeString);
      }

      currentMinutes += duration;
    }

    return { success: true, data: slots };
  } catch (error) {
    console.error('Error getting available slots:', error);
    return { success: false, error: 'Error al calcular los turnos disponibles.' };
  }
}

// 3. Crear una nueva reserva (Para el Frontend Público y Admin)
export async function createBooking(data: any) {
  try {
    // Convertir string date y time a un objeto Date real
    const startTime = new Date(`${data.date}T${data.time}:00`);

    // Obtener la duración del turno para esa cancha y ese día
    const dayOfWeek = startTime.getDay();
    const businessHour = await prisma.businessHour.findFirst({
      where: { courtId: data.courtId, dayOfWeek }
    });

    if (!businessHour) {
      return { success: false, error: 'La cancha no está disponible ese día.' };
    }

    const endTime = new Date(startTime.getTime() + businessHour.slotDuration * 60000);

    // Doble check de seguridad por si dos personas tocan "Reservar" al mismo tiempo
    const existing = await prisma.booking.findFirst({
      where: {
        courtId: data.courtId,
        startTime: startTime,
        status: { not: 'CANCELLED' }
      }
    });

    if (existing) {
      return { success: false, error: 'Lo sentimos, este turno acaba de ser reservado.' };
    }

    // Crear la reserva
    const booking = await prisma.booking.create({
      data: {
        courtId: data.courtId,
        userId: data.userId || null, // Si tenés auth acá va el ID del user
        startTime,
        endTime,
        totalAmount: data.totalAmount || 0,
        status: 'PENDING' // Arranca pendiente hasta que pague o confirmes
      }
    });

    // Limpiar caché de las páginas afectadas
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/dashboard');
    revalidatePath('/reservas');

    return { success: true, data: booking };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Ocurrió un error al procesar la reserva.' };
  }
}