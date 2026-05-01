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

        // 1. Buscamos TODOS los turnos de ese día para esa cancha (Reservas, Bloqueos y Fijos)
        const bookings = await prisma.booking.findMany({
            where: {
                courtId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' }
            }
        });

        // 2. Generamos la grilla base (Ej: de 16:00 a 23:00, cada 90 mins)
        // Ajustá estos horarios según tu lógica de negocio
        const timeSlots = ['16:00', '17:30', '19:00', '20:30', '22:00'];

        // 3. Filtramos los que ya están pisados por la BD
        const available = timeSlots.filter(time => {
            const slotStart = new Date(`${dateStr}T${time}:00`).getTime();
            // Si algún turno en la BD arranca a la misma hora o pisa este horario, lo sacamos
            const isOccupied = bookings.some(b => {
                const bStart = new Date(b.startTime).getTime();
                const bEnd = new Date(b.endTime).getTime();
                // Lógica simple: Si el turno arranca dentro del bloque de 90 min o viceversa
                return (slotStart >= bStart && slotStart < bEnd);
            });
            return !isOccupied;
        });

        return { success: true, data: available };
    } catch (error) {
        return { success: false, error: 'Error al consultar disponibilidad' };
    }
}