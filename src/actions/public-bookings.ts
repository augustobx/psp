'use server';

import { prisma } from '@/lib/prisma';

export async function getPublicCourts() {
    try {
        const courts = await prisma.court.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: courts };
    } catch (error) {
        return { success: false, error: 'Error al cargar canchas' };
    }
}

export async function getAvailableSlots(courtId: string, dateStr: string) {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59`);

        const bookings = await prisma.booking.findMany({
            where: {
                courtId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' }
            }
        });

        // Generamos la grilla base. (Ajustá estos horarios según tu club)
        const timeSlots = ['14:30', '16:00', '17:30', '19:00', '20:30', '22:00'];

        // Mapeamos cada bloque de horario para ver si está libre o pisado por algún turno
        const slotsData = timeSlots.map(time => {
            const slotStart = new Date(`${dateStr}T${time}:00`).getTime();

            const occupyingBooking = bookings.find(b => {
                const bStart = new Date(b.startTime).getTime();
                const bEnd = new Date(b.endTime).getTime();
                return (slotStart >= bStart && slotStart < bEnd);
            });

            if (occupyingBooking) {
                // Devolvemos el estado exacto (CONFIRMED, BLOCKED, FIXED)
                return { time, status: occupyingBooking.status };
            }

            return { time, status: 'AVAILABLE' };
        });

        return { success: true, data: slotsData };
    } catch (error) {
        return { success: false, error: 'Error al consultar disponibilidad' };
    }
}