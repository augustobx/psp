'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getFixedBookings() {
    try {
        const fixedBookings = await prisma.fixedBooking.findMany({
            include: {
                user: true,
                court: true,
                _count: {
                    select: { bookings: { where: { status: { not: 'CANCELLED' } } } }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
        return { success: true, data: fixedBookings };
    } catch (error: any) {
        return { success: false, error: 'Error al obtener los abonos fijos.' };
    }
}

export async function deleteFixedBooking(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Delete or mark inactive the fixed booking
            await tx.fixedBooking.update({
                where: { id },
                data: { isActive: false }
            });

            // Cancel all future bookings related to this fixed booking
            const now = new Date();
            await tx.booking.updateMany({
                where: {
                    fixedBookingId: id,
                    startTime: { gte: now }
                },
                data: {
                    status: 'CANCELLED'
                }
            });
        });

        revalidatePath('/admin/abonos');
        revalidatePath('/admin/calendar');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Error al eliminar el abono.' };
    }
}
