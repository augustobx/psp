'use server';

import { prisma } from '@/lib/prisma';
import { addMinutes, format, parse, startOfDay, endOfDay } from 'date-fns';

export async function getAdminCalendarData(courtId: string, dateStr: string) {
    try {
        const date = new Date(`${dateStr}T00:00:00`);
        const dayOfWeek = date.getDay();

        // 1. Obtener Horarios de Atención y Reservas en paralelo
        const [businessHour, bookings, court] = await Promise.all([
            prisma.businessHour.findFirst({ where: { courtId, dayOfWeek } }),
            prisma.booking.findMany({
                where: {
                    courtId,
                    startTime: { gte: startOfDay(date), lte: endOfDay(date) },
                    status: { not: 'CANCELLED' }
                },
                include: { user: true }
            }),
            prisma.court.findUnique({ where: { id: courtId } })
        ]);

        if (!businessHour) return { success: false, error: 'Sin horarios configurados.' };

        // 2. Generar Slots Dinámicos basados en la duración configurada
        const slots = [];
        let current = parse(businessHour.openTime, 'HH:mm', date);
        const end = parse(businessHour.closeTime, 'HH:mm', date);

        while (current < end) {
            const slotStart = current;
            const slotEnd = addMinutes(current, businessHour.slotDuration);
            const timeStr = format(slotStart, 'HH:mm');

            // Buscar si este slot está ocupado por una reserva activa
            const booking = bookings.find(b => {
                const bStart = format(new Date(b.startTime), 'HH:mm');
                return bStart === timeStr;
            });

            slots.push({
                time: timeStr,
                endTime: format(slotEnd, 'HH:mm'),
                status: booking ? booking.status : 'FREE',
                booking: booking || null,
            });

            current = slotEnd;
        }

        return { success: true, data: { slots, courtName: court?.name } };
    } catch (error) {
        console.error('Error en Admin Calendar Action:', error);
        return { success: false, error: 'Error al cargar el calendario operativo.' };
    }
}