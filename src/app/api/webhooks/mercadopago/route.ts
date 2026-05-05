// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import { Payment, MercadoPagoConfig } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmation } from '@/lib/whatsapp/notifications';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'payment') {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: data.id });

      if (paymentInfo.status === 'approved') {
        const bookingId = paymentInfo.external_reference;

        if (bookingId) {
          // 1. Actualizar estado de la reserva a CONFIRMED
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              paymentId: String(paymentInfo.id),
            },
          });

          console.log(`✅ Pago aprobado para booking ${bookingId} — PaymentID: ${paymentInfo.id}`);

          // 2. Enviar confirmación automática por WhatsApp
          //    Funciona tanto para reservas de WhatsApp como de la PWA
          await sendBookingConfirmation(bookingId);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    // Respondemos 200 para que MP no reintente infinitamente
    return NextResponse.json({ success: false }, { status: 200 });
  }
}