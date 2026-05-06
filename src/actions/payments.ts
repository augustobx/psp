'use server';

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { prisma } from '@/lib/prisma';

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

    // Leer el token de MP desde SystemSetting (lo configura el admin desde la web)
    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const mpToken = settings?.mpAccessToken;

    if (!mpToken) {
      return { success: false, error: 'No hay token de MercadoPago configurado en el panel de admin.' };
    }

    const client = new MercadoPagoConfig({
      accessToken: mpToken,
    });

    const preference = new Preference(client);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

    const result = await preference.create({
      body: {
        items: [
          {
            id: booking.id,
            title: `Seña - ${booking.court.name}`,
            quantity: 1,
            unit_price: Number(booking.totalAmount),
            currency_id: 'ARS',
          }
        ],
        payer: {
          email: booking.user?.email || 'cliente@psp.local',
          name: booking.user?.name || 'Cliente',
        },
        // CORRECCIÓN: Evitamos el 404 redirigiendo a la raíz de la app con un parámetro de estado.
        back_urls: {
          success: `${appUrl}?status=success`,
          failure: `${appUrl}?status=failure`,
          pending: `${appUrl}?status=pending`,
        },
        auto_return: 'approved',
        external_reference: booking.id,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      }
    });

    return { success: true, init_point: result.init_point };
  } catch (error) {
    console.error('Error creando preferencia de MercadoPago:', error);
    return { success: false, error: 'No se pudo inicializar el pago' };
  }
}