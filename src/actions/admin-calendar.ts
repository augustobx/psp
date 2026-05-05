'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addMinutes, format, parse, startOfDay, endOfDay } from 'date-fns';

// Función para obtener slots (Libres + Ocupados)
export async function getAdminCalendarData(courtId: string, dateStr: string) {
    try {
        const date = new Date(`${dateStr}T00:00:00`);
        const dayOfWeek = date.getDay();

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

        const slots = [];
        let current = parse(businessHour.openTime, 'HH:mm', date);
        const end = parse(businessHour.closeTime, 'HH:mm', date);

        while (current < end) {
            const slotStart = current;
            const slotEnd = addMinutes(current, businessHour.slotDuration);
            const timeStr = format(slotStart, 'HH:mm');

            const booking = bookings.find(b => format(new Date(b.startTime), 'HH:mm') === timeStr);

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
        console.error(error);
        return { success: false, error: 'Error al cargar el calendario.' };
    }
}

// Función para crear reserva manual desde el admin
export async function createAdminBooking(data: {
    courtId: string;
    dateStr: string;
    startTimeStr: string;
    endTimeStr: string;
    type: 'RESERVA' | 'BLOQUEO' | 'FIJO';
    clientName?: string;
}) {
    try {
        const startTime = new Date(`${data.dateStr}T${data.startTimeStr}:00`);
        const endTime = new Date(`${data.dateStr}T${data.endTimeStr}:00`);

        const status = data.type === 'BLOQUEO' ? 'BLOCKED' : data.type === 'FIJO' ? 'FIXED' : 'CONFIRMED';
        const description = data.clientName || (data.type === 'BLOQUEO' ? 'Bloqueo' : 'Reserva Manual');

        await prisma.$transaction(async (tx) => {
            const existing = await tx.booking.findFirst({
                where: {
                    courtId: data.courtId,
                    status: { in: ['PENDING', 'CONFIRMED', 'FIXED', 'BLOCKED'] },
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                }
            });
            if (existing) throw new Error('SLOT_TAKEN');

            await tx.booking.create({
                data: {
                    courtId: data.courtId,
                    startTime,
                    endTime,
                    status: status as any,
                    totalAmount: 0,
                    description,
                }
            });
        });

        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message === 'SLOT_TAKEN' ? 'Horario superpuesto.' : 'Error en DB.' };
    }
}

// Función para cancelar
export async function cancelAdminBooking(bookingId: string) {
    try {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        });
        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Error al cancelar.' };
    }
}