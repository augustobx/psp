'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAdminDayBookings(dateStr: string) {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59`);

        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' }
            },
            include: {
                court: true,
                user: true,
            },
            orderBy: { startTime: 'asc' },
        });

        return { success: true, data: bookings };
    } catch (error: any) {
        console.error('Error fetching calendar bookings:', error);
        return { success: false, error: 'Error al cargar el calendario.' };
    }
}

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

        if (endTime <= startTime) {
            return { success: false, error: 'La hora de fin debe ser posterior a la hora de inicio.' };
        }

        let status: string = 'CONFIRMED';
        let description = data.clientName || 'Reserva Manual';

        if (data.type === 'BLOQUEO') {
            status = 'BLOCKED';
            description = data.clientName || 'Bloqueo por Mantenimiento';
        } else if (data.type === 'FIJO') {
            status = 'FIXED';
            description = data.clientName || 'Abono Fijo';
        }

        // TRANSACCIÓN ATÓMICA — Anti-duplicación desde el admin
        await prisma.$transaction(async (tx) => {
            const existing = await tx.booking.findFirst({
                where: {
                    courtId: data.courtId,
                    status: { in: ['PENDING', 'CONFIRMED', 'FIXED', 'BLOCKED'] },
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                }
            });

            if (existing) {
                throw new Error('SLOT_TAKEN');
            }

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
        revalidatePath('/admin/dashboard');
        revalidatePath('/reservas');
        return { success: true };
    } catch (error: any) {
        if (error?.message === 'SLOT_TAKEN') {
            return { success: false, error: 'El horario seleccionado se superpone con un turno existente.' };
        }
        console.error('Error creando turno DB:', error);
        return { success: false, error: error.message || 'Error desconocido en la base de datos.' };
    }
}

export async function cancelAdminBooking(bookingId: string) {
    try {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        });
        revalidatePath('/admin/calendar');
        revalidatePath('/admin/dashboard');
        revalidatePath('/reservas');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al cancelar.' };
    }
}