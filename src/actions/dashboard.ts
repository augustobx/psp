'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const [
            todayBookingsCount,
            activeCourtsCount,
            pendingBookings,
            activeTournamentsCount
        ] = await Promise.all([
            prisma.booking.count({
                where: {
                    startTime: { gte: today, lt: tomorrow },
                }
            }),
            prisma.court.count({
                where: { isActive: true }
            }),
            prisma.booking.aggregate({
                where: { status: 'PENDING' },
                _sum: { totalAmount: true }
            }),
            prisma.tournament.count({
                where: { status: 'ONGOING' }
            })
        ]);

        return {
            success: true,
            data: {
                todayBookings: todayBookingsCount,
                activeCourts: activeCourtsCount,
                pendingRevenue: pendingBookings._sum.totalAmount || 0,
                activeTournaments: activeTournamentsCount,
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return { success: false, error: 'Error cargando estadísticas' };
    }
}

export async function getTodaySnapshot() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const bookings = await prisma.booking.findMany({
            where: {
                startTime: { gte: today, lt: tomorrow },
            },
            include: {
                court: true,
                user: true,
            },
            orderBy: { startTime: 'asc' }
        });

        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error fetching today snapshot:', error);
        return { success: false, error: 'Error cargando la agenda del día' };
    }
}