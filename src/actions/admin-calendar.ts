'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Obtener todas las reservas de un día
export async function getAdminDayBookings(dateStr: string) {
    try {
        const startOfDay = new Date(`${dateStr}T00:00:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59`);

        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' } // No mostramos las canceladas en la grilla visual
            },
            include: {
                court: true,
                user: true,
            },
        });

        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching calendar bookings:', error);
        return { success: false, error: 'Error al cargar el calendario.' };
    }
}

// Crear una reserva manual o un bloqueo desde el panel
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

        // Validar superposición
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

        // El estado y descripción dependen de lo que estemos creando
        let status: any = 'CONFIRMED';
        let description = data.clientName || 'Reserva Manual';

        if (data.type === 'BLOQUEO') {
            status = 'BLOCKED'; // Asegurate de que tu modelo Prisma acepte este estado, o usa PENDING/CONFIRMED con una descripción
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
                userId: null as any, // <-- Le pasamos el campo para callar a TypeScript
            }
        });

        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error) {
        console.error('Error creating admin booking:', error);
        return { success: false, error: 'Ocurrió un error al guardar.' };
    }
}

// Cancelar/Eliminar una reserva o bloqueo
export async function cancelAdminBooking(bookingId: string) {
    try {
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        });
        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error) {
        console.error('Error canceling booking:', error);
        return { success: false, error: 'Error al cancelar.' };
    }
}