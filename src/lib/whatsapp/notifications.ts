// src/lib/whatsapp/notifications.ts
// Módulo centralizado de notificaciones post-pago por WhatsApp.
// Se usa tanto para reservas hechas por WhatsApp como por la PWA.

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from './api';

/** Formatea una fecha a "DD/MM/YYYY" */
function formatDateStr(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/** Formatea hora "HH:mm" */
function formatTime(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

// ============================================================================
// NOTIFICACIÓN POST-PAGO — Se dispara desde el webhook de MercadoPago
// Funciona para CUALQUIER booking (WhatsApp o PWA)
// ============================================================================
export async function sendBookingConfirmation(bookingId: string): Promise<void> {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                court: true,
                user: true,
            },
        });

        if (!booking || !booking.user) {
            console.warn(`⚠️ No se pudo enviar confirmación: booking ${bookingId} sin usuario`);
            return;
        }

        const phone = booking.user.phone;

        if (!phone) {
            console.warn(`⚠️ Usuario ${booking.user.id} no tiene teléfono registrado, no se envía WhatsApp`);
            return;
        }

        const clientName = booking.user.name || `Cliente ${phone.slice(-4)}`;
        const fecha = formatDateStr(booking.startTime);
        const horaInicio = formatTime(booking.startTime);
        const horaFin = formatTime(booking.endTime);
        const amount = Number(booking.totalAmount);
        const priceText = amount > 0 ? `\n💰 *Seña pagada:* $${amount.toLocaleString('es-AR')}` : '';

        const message =
            `✅ *¡Pago confirmado, ${clientName}!*\n\n` +
            `Tu turno quedó *confirmado* y la cancha es tuya. 🎾\n\n` +
            `📍 *Cancha:* ${booking.court.name}\n` +
            `📅 *Fecha:* ${fecha}\n` +
            `🕐 *Horario:* ${horaInicio} - ${horaFin}` +
            priceText +
            `\n📌 *Estado:* ✅ Confirmado\n\n` +
            `¡Te esperamos en PSP Padel Club! 💪`;

        await sendWhatsAppMessage(phone, message);
        console.log(`📩 Confirmación WhatsApp enviada a ${phone} para booking ${bookingId}`);
    } catch (error) {
        console.error(`❌ Error enviando confirmación WhatsApp para booking ${bookingId}:`, error);
        // No lanzamos el error para no romper el webhook de MP
    }
}
