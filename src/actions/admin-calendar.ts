'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { addMinutes, format, parse, startOfDay, endOfDay, addWeeks } from 'date-fns';

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

            const startOfD = startOfDay(date);
            const endOfD = endOfDay(date);

            const bookings = await prisma.booking.findMany({
                where: {
                    courtId: court.id,
                    startTime: { gte: startOfD, lte: endOfD },
                    status: { not: 'CANCELLED' }
                },
                include: { user: true }
            });

            const fixedBookings = await prisma.fixedBooking.findMany({
                where: {
                    courtId: court.id,
                    dayOfWeek,
                    isActive: true,
                    startDate: { lte: endOfD },
                    endDate: { gte: startOfD },
                },
                include: { user: true }
            });

            const courtBlocks = await prisma.courtBlock.findMany({
                where: {
                    courtId: court.id,
                    startTime: { lte: endOfD },
                    endTime: { gte: startOfD },
                },
            });

            const slots = [];
            if (businessHour) {
                const [openHour, openMin] = businessHour.openTime.split(':').map(Number);
                const [closeHour, closeMin] = businessHour.closeTime.split(':').map(Number);
                let currentMinutes = openHour * 60 + openMin;
                const endMinutes = closeHour * 60 + closeMin;
                const duration = businessHour.slotDuration;

                while (currentMinutes + duration <= endMinutes) {
                    const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
                    const slotStartM = (currentMinutes % 60).toString().padStart(2, '0');
                    const slotEndMins = currentMinutes + duration;
                    const slotEndH = Math.floor(slotEndMins / 60).toString().padStart(2, '0');
                    const slotEndM = (slotEndMins % 60).toString().padStart(2, '0');

                    const timeStr = `${slotStartH}:${slotStartM}`;
                    const endTimeStr = `${slotEndH}:${slotEndM}`;

                    const slotStartTime = new Date(`${dateStr}T${timeStr}:00`).getTime();
                    const slotEndTime = new Date(`${dateStr}T${endTimeStr}:00`).getTime();

                    // Buscar reservas normales que se solapen
                    const booking = bookings.find(b => {
                        const bStart = new Date(b.startTime).getTime();
                        const bEnd = new Date(b.endTime).getTime();
                        return slotStartTime < bEnd && slotEndTime > bStart;
                    });

                    // Buscar abonos fijos que se solapen
                    const fixed = fixedBookings.find(fb => {
                        const [fbStartH, fbStartM] = fb.startTime.split(':').map(Number);
                        const [fbEndH, fbEndM] = fb.endTime.split(':').map(Number);
                        const fbStartMin = fbStartH * 60 + fbStartM;
                        const fbEndMin = fbEndH * 60 + fbEndM;
                        return currentMinutes < fbEndMin && slotEndMins > fbStartMin;
                    });

                    // Buscar bloqueos que se solapen
                    const block = courtBlocks.find(cb => {
                        const cbStart = new Date(cb.startTime).getTime();
                        const cbEnd = new Date(cb.endTime).getTime();
                        return slotStartTime < cbEnd && slotEndTime > cbStart;
                    });

                    let finalStatus = 'FREE';
                    let finalBooking = null;

                    if (booking) {
                        finalStatus = booking.status;
                        finalBooking = booking;
                    } else if (fixed) {
                        finalStatus = 'FIXED';
                        finalBooking = { id: fixed.id, user: fixed.user };
                    } else if (block) {
                        finalStatus = 'BLOCKED';
                        finalBooking = { id: block.id, user: { name: block.reason || 'Bloqueo' } };
                    }

                    slots.push({
                        time: timeStr,
                        endTime: endTimeStr,
                        status: finalStatus,
                        booking: finalBooking,
                    });

                    currentMinutes += duration;
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

// Crear reserva administrativa (Simple, Bloqueo o Fijo)
export async function createAdminBooking(data: {
    courtId: string;
    dateStr: string;
    startTimeStr: string;
    endTimeStr: string;
    type: 'RESERVA' | 'BLOQUEO' | 'FIJO';
    clientName?: string;
    clientPhone?: string;
}) {
    try {
        const baseStartTime = new Date(`${data.dateStr}T${data.startTimeStr}:00`);
        const baseEndTime = new Date(`${data.dateStr}T${data.endTimeStr}:00`);
        const status = data.type === 'BLOQUEO' ? 'BLOCKED' : data.type === 'FIJO' ? 'FIXED' : 'CONFIRMED';

        // Creamos un usuario dummy local para asociar la reserva
        let user = await prisma.user.findFirst({ where: { phone: data.clientPhone || 'ADMIN_LOCAL' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: data.clientName || (data.type === 'BLOQUEO' ? 'Cancha Bloqueada' : 'Turno Local'),
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

        // Si es FIJO, generamos por 6 meses (24 semanas). Si es normal, solo 1 semana.
        const weeksToGenerate = data.type === 'FIJO' ? 24 : 1;

        // Transacción para insertar las reservas
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < weeksToGenerate; i++) {
                const startTime = addWeeks(baseStartTime, i);
                const endTime = addWeeks(baseEndTime, i);

                const existing = await tx.booking.findFirst({
                    where: {
                        courtId: data.courtId,
                        status: { in: ['PENDING', 'CONFIRMED', 'FIXED', 'BLOCKED'] },
                        startTime: { lt: endTime },
                        endTime: { gt: startTime },
                    }
                });

                // Si está libre, lo creamos
                if (!existing) {
                    await tx.booking.create({
                        data: {
                            courtId: data.courtId,
                            userId: user!.id,
                            startTime,
                            endTime,
                            status: status as any,
                            totalAmount: 0,
                        }
                    });
                } else if (data.type !== 'FIJO') {
                    // Si es una reserva simple/bloqueo y está ocupado, tira error
                    throw new Error('SLOT_TAKEN');
                }
                // (Si es FIJO y está ocupado, simplemente ignora esa semana puntual y sigue con las demás)
            }
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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