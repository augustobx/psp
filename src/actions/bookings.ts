'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Obtener reservas por día (Para el Panel de Admin)
export async function getBookingsByDate(dateStr: string) {
  try {
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      include: {
        court: true,
        user: true,
      },
      orderBy: [
        { courtId: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return { success: true, data: bookings };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { success: false, error: 'Error al cargar las reservas del día.' };
  }
}

// 2. Crear una nueva reserva (Para el Frontend Público — PWA)
//    Usa Prisma $transaction para evitar CUALQUIER duplicación por race condition.
export async function createBooking(data: {
  courtId: string;
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:mm"
  name: string;
  phone: string;
  email: string;
}) {
  try {
    const startTime = new Date(`${data.date}T${data.time}:00`);
    const dayOfWeek = startTime.getDay();

    const businessHour = await prisma.businessHour.findFirst({
      where: { courtId: data.courtId, dayOfWeek }
    });

    if (!businessHour) {
      return { success: false, error: 'La cancha no está disponible ese día.' };
    }

    const endTime = new Date(startTime.getTime() + businessHour.slotDuration * 60000);

    // Buscar o crear usuario ANTES de la transacción (no es crítico para race condition)
    let user = await prisma.user.findFirst({
      where: { email: data.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: 'PLAYER',
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: data.name, phone: data.phone }
      });
    }

    // Obtener config
    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const fee = settings?.reservationFee ?? 0;
    const requireDeposit = settings?.requireDeposit ?? false;

    // ========== TRANSACCIÓN ATÓMICA — ANTI-DUPLICACIÓN ==========
    // Dentro de la transacción: verificar overlap + crear booking.
    // Si 2 requests entran al mismo tiempo, solo 1 gana.
    const booking = await prisma.$transaction(async (tx) => {
      // Check de overlap DENTRO de la transacción (serializable)
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

      return tx.booking.create({
        data: {
          courtId: data.courtId,
          userId: user!.id,
          startTime,
          endTime,
          totalAmount: requireDeposit ? fee : 0,
          status: requireDeposit ? 'PENDING' : 'CONFIRMED',
        }
      });
    });

    revalidatePath('/admin/calendar');
    revalidatePath('/admin/dashboard');
    revalidatePath('/reservas');

    // === NOTIFICACIONES WHATSAPP AL CLIENTE ===
    const { sendBookingConfirmation, sendBookingPendingPayment } = await import('@/lib/whatsapp/notifications');

    if (!requireDeposit) {
      sendBookingConfirmation(booking.id).catch(err =>
        console.error('Error enviando confirmación WhatsApp (PWA sin seña):', err)
      );
    } else if (requireDeposit && fee > 0) {
      try {
        const { createPaymentPreference } = await import('@/actions/payments');
        const paymentResult = await createPaymentPreference(booking.id);

        if (paymentResult.success && paymentResult.init_point) {
          sendBookingPendingPayment(booking.id, paymentResult.init_point).catch(err =>
            console.error('Error enviando link de pago WhatsApp (PWA con seña):', err)
          );
        }
      } catch (err) {
        console.error('Error generando preferencia de pago para WhatsApp:', err);
      }
    }

    // === NOTIFICACIÓN AUTOMÁTICA AL ADMINISTRADOR/DUEÑO ===
    if (settings?.courtPhone) {
      try {
        const courtDetails = await prisma.court.findUnique({ where: { id: data.courtId } });

        // Limites de tiempo para contar los turnos de ese día exacto
        const startOfDay = new Date(`${data.date}T00:00:00`);
        const endOfDay = new Date(`${data.date}T23:59:59`);

        // Obtenemos todas las canchas y contamos los turnos confirmados/pendientes
        const courtsWithCounts = await prisma.court.findMany({
          include: {
            _count: {
              select: {
                bookings: {
                  where: {
                    startTime: { gte: startOfDay, lte: endOfDay },
                    status: { not: 'CANCELLED' }
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        });

        // Construir el texto del resumen
        let countersText = "📊 *Resumen del día:*\n";
        courtsWithCounts.forEach(c => {
          countersText += `• ${c.name}: ${c._count.bookings} turnos\n`;
        });

        // Armar el mensaje final
        const adminMessage = `🚨 *NUEVA RESERVA INGRESADA*\n\n👤 *Cliente:* ${data.name}\n📱 *Teléfono:* ${data.phone}\n🎾 *Cancha:* ${courtDetails?.name || 'Cancha'}\n📅 *Día:* ${data.date}\n⏰ *Hora:* ${data.time} hs\n\n${countersText}`;

        // Importamos la API de WhatsApp y disparamos el mensaje
        const { sendMessage } = await import('@/lib/whatsapp/api');
        sendMessage(settings.courtPhone, adminMessage).catch(err =>
          console.error('Error enviando WhatsApp al admin:', err)
        );

      } catch (adminErr) {
        console.error('Error procesando notificación al admin:', adminErr);
      }
    }

    return { success: true, data: { bookingId: booking.id, fee, requireDeposit } };
  } catch (error: any) {
    if (error?.message === 'SLOT_TAKEN') {
      return { success: false, error: 'Lo sentimos, este turno acaba de ser reservado por otra persona.' };
    }
    console.error('Error creating booking:', error);
    return { success: false, error: 'Ocurrió un error al procesar la reserva.' };
  }
}