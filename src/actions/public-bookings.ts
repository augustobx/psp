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
        const targetDate = new Date(`${dateStr}T00:00:00`);
        const dayOfWeek = targetDate.getDay();

        // 1. Buscar horario de negocio para esta cancha y día
        const businessHour = await prisma.businessHour.findFirst({
            where: { courtId, dayOfWeek },
        });

        if (!businessHour) {
            return { success: true, data: [] }; // No abre este día
        }

        // 2. Buscar reservas existentes del día (no canceladas)
        const startOfDay = new Date(`${dateStr}T00:00:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999`);

        const existingBookings = await prisma.booking.findMany({
            where: {
                courtId,
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { in: ['PENDING', 'CONFIRMED', 'FIXED', 'BLOCKED'] },
            },
        });

        // 3. Buscar abonos fijos activos para este día de la semana
        const fixedBookings = await prisma.fixedBooking.findMany({
            where: {
                courtId,
                dayOfWeek,
                isActive: true,
                startDate: { lte: endOfDay },
                endDate: { gte: startOfDay },
            },
        });

        // 4. Buscar bloqueos de cancha vigentes
        const courtBlocks = await prisma.courtBlock.findMany({
            where: {
                courtId,
                startTime: { lte: endOfDay },
                endTime: { gte: startOfDay },
            },
        });

        // 5. Generar grilla dinámica desde BusinessHour
        const [openHour, openMin] = businessHour.openTime.split(':').map(Number);
        const [closeHour, closeMin] = businessHour.closeTime.split(':').map(Number);
        const duration = businessHour.slotDuration;

        let currentMinutes = openHour * 60 + openMin;
        const endMinutes = closeHour * 60 + closeMin;
        const now = new Date();

        const slotsData: { time: string; status: string }[] = [];

        while (currentMinutes + duration <= endMinutes) {
            const slotStartH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
            const slotStartM = (currentMinutes % 60).toString().padStart(2, '0');
            const timeStr = `${slotStartH}:${slotStartM}`;

            const slotEndMinutes = currentMinutes + duration;

            const slotStartTime = new Date(`${dateStr}T${timeStr}:00`);
            const slotEndTime = new Date(`${dateStr}T${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}:00`);

            // ¿El slot ya pasó? (solo para hoy)
            if (slotStartTime <= now) {
                currentMinutes += duration;
                continue;
            }

            // ¿Tiene una reserva que se solapa? (OVERLAP real)
            const occupyingBooking = existingBookings.find(b => {
                const bStart = new Date(b.startTime).getTime();
                const bEnd = new Date(b.endTime).getTime();
                return slotStartTime.getTime() < bEnd && slotEndTime.getTime() > bStart;
            });

            if (occupyingBooking) {
                slotsData.push({ time: timeStr, status: occupyingBooking.status });
                currentMinutes += duration;
                continue;
            }

            // ¿Tiene un abono fijo que se solapa?
            const isFixedOccupied = fixedBookings.some(fb => {
                const [fbStartH, fbStartM] = fb.startTime.split(':').map(Number);
                const [fbEndH, fbEndM] = fb.endTime.split(':').map(Number);
                const fbStartMin = fbStartH * 60 + fbStartM;
                const fbEndMin = fbEndH * 60 + fbEndM;
                return currentMinutes < fbEndMin && slotEndMinutes > fbStartMin;
            });

            if (isFixedOccupied) {
                slotsData.push({ time: timeStr, status: 'FIXED' });
                currentMinutes += duration;
                continue;
            }

            // ¿Tiene un bloqueo de cancha?
            const isBlocked = courtBlocks.some(block => {
                const blockStart = new Date(block.startTime).getTime();
                const blockEnd = new Date(block.endTime).getTime();
                return slotStartTime.getTime() < blockEnd && slotEndTime.getTime() > blockStart;
            });

            if (isBlocked) {
                slotsData.push({ time: timeStr, status: 'BLOCKED' });
                currentMinutes += duration;
                continue;
            }

            // ✅ Slot disponible
            slotsData.push({ time: timeStr, status: 'AVAILABLE' });
            currentMinutes += duration;
        }

        return { success: true, data: slotsData };
    } catch (error) {
        console.error('Error calculating available slots:', error);
        return { success: false, error: 'Error al consultar disponibilidad' };
    }
}