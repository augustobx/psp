import { NextResponse } from 'next/server';
import { Payment, MercadoPagoConfig } from 'mercadopago';
import { prisma } from '@/lib/prisma';

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
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              paymentId: String(paymentInfo.id),
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}