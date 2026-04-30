'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { prisma } from '@/lib/prisma';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

export async function createPaymentPreference(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        court: true,
      },
    });

    if (!booking) {
      throw new Error('Reserva no encontrada');
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: booking.id,
            title: `Reserva Cancha ${booking.court.name}`,
            quantity: 1,
            unit_price: Number(booking.totalAmount),
            currency_id: 'ARS',
          }
        ],
        payer: {
          email: booking.user.email,
          // Forzamos un string fallback para eliminar el error de 'null' vs 'undefined'
          name: booking.user.name || 'Cliente',
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/pending`,
        },
        auto_return: 'approved',
        external_reference: booking.id,
      }
    });

    return { success: true, init_point: result.init_point };
  } catch (error) {
    console.error('Error creando preferencia de MercadoPago:', error);
    return { success: false, error: 'No se pudo inicializar el pago' };
  }
}