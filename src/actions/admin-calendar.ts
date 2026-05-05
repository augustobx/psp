'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addMinutes, format, parse, startOfDay, endOfDay } from 'date-fns';

export async function getAdminCalendarData(courtId: string, dateStr: string) {
    try {
        const date = new Date(`${dateStr}T00:00:00`);
        const dayOfWeek = date.getDay();

        // 1. Determinar qué canchas buscar
        const courtsQuery = courtId === 'ALL' ? { isActive: true } : { id: courtId };
        const courts = await prisma.court.findMany({
            where: courtsQuery,
            orderBy: { name: 'asc' }
        });

        const results = [];

        // 2. Por cada cancha, generamos su línea de tiempo de slots
        for (const court of courts) {
            const businessHour = await prisma.businessHour.findFirst({ where: { courtId: court.id, dayOfWeek } });

            const bookings = await prisma.booking.findMany({
                where: {
                    courtId: court.id,
                    startTime: { gte: startOfDay(date), lte: endOfDay(date) },
                    status: { not: 'CANCELLED' }
                },
                include: { user: true }
            });

            const slots = [];
            if (businessHour) {
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
            }

            results.push({ court, businessHour, slots });
        }

        return { success: true, data: results };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Error al cargar el calendario.' };
    }
}

// Crear reserva administrativa
export async function createAdminBooking(data: {
    courtId: string;
    dateStr: string;
    startTimeStr: string;
    endTimeStr: string;
    type: 'RESERVA' | 'BLOQUEO';
    clientName?: string;
    clientPhone?: string;
}) {
    try {
        const startTime = new Date(`${data.dateStr}T${data.startTimeStr}:00`);
        const endTime = new Date(`${data.dateStr}T${data.endTimeStr}:00`);
        const status = data.type === 'BLOQUEO' ? 'BLOCKED' : 'CONFIRMED';

        // Creamos un usuario dummy local para asociar la reserva
        let user = await prisma.user.findFirst({ where: { phone: data.clientPhone || 'ADMIN_LOCAL' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: data.clientName || (data.type === 'BLOQUEO' ? 'Cancha Bloqueada' : 'Cliente Local'),
                    phone: data.clientPhone || 'ADMIN_LOCAL',
                    email: `${Date.now()}@local.psp`,
                    role: 'PLAYER'
                }
            });
        } else if (data.clientName) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { name: data.clientName }
            });
        }

        // Transacción para evitar solapamientos
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
                    userId: user!.id,
                    startTime,
                    endTime,
                    status: status as any,
                    totalAmount: 0, // Como es administrativa, la cobranza se maneja en mostrador
                }
            });
        });

        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message === 'SLOT_TAKEN' ? 'Horario superpuesto.' : 'Error al guardar.' };
    }
}

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