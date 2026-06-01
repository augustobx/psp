'use server';

import { prisma } from '@/lib/prisma';

export async function getHistoryBookings(startDateStr?: string, endDateStr?: string) {
  try {
    let whereClause: any = {};

    if (startDateStr && endDateStr) {
      const startOfDay = new Date(`${startDateStr}T00:00:00`);
      const endOfDay = new Date(`${endDateStr}T23:59:59.999`);
      
      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        court: true,
        user: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching history bookings:', error);
    return { success: false, error: 'Error al cargar el historial de reservas.' };
  }
}
