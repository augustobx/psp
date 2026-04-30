'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { prisma } from '@/lib/prisma';

// Inicializar cliente
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function createPaymentPreference(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, court: true }
    });

    if (!booking) {
      return { success: false, error: 'Reserva no encontrada' };
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: booking.id,
            title: `Reserva Cancha ${booking.court.name}`,
            quantity: 1,
            unit_price: Number(booking.totalPrice),
            currency_id: 'ARS',
          }
        ],
        payer: {
          email: booking.user.email,
          name: booking.user.name,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/pending`,
        },
        auto_return: 'approved',
        external_reference: booking.id,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      }
    });

    // Guardar referencia en DB
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalPrice,
        mpPreferenceId: result.id,
        status: 'PENDING'
      }
    });

    return { success: true, init_point: result.init_point };
  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    return { success: false, error: 'Error al iniciar el pago.' };
  }
}
