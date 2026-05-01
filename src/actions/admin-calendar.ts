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

        const existing = await prisma.booking.findFirst({
            where: {
                courtId: data.courtId,
                status: { not: 'CANCELLED' },
                AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gt: startTime } }
                ]
            }
        });

        if (existing) {
            return { success: false, error: 'El horario seleccionado se superpone con un turno existente.' };
        }

        let status: any = 'CONFIRMED';
        let description = data.clientName || 'Reserva Manual';

        if (data.type === 'BLOQUEO') {
            status = 'BLOCKED';
            description = data.clientName || 'Bloqueo por Mantenimiento';
        } else if (data.type === 'FIJO') {
            status = 'FIXED';
            description = data.clientName || 'Abono Fijo';
        }

        await prisma.booking.create({
            data: {
                courtId: data.courtId,
                startTime,
                endTime,
                status,
                totalAmount: 0,
                userId: null as any,
                description: description,
            }
        });

        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        console.error('Error creando turno DB:', error);
        // ACÁ ESTÁ LA CLAVE: Devolvemos el mensaje exacto de la base de datos
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
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al cancelar.' };
    }
}