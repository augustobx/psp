import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (type === 'payment' && dataId) {
      const paymentClient = new Payment(client);
      const paymentInfo = await paymentClient.get({ id: dataId });

      const externalReference = paymentInfo.external_reference; // Booking ID
      const status = paymentInfo.status;

      if (externalReference) {
        let newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' = 'PENDING';
        
        if (status === 'approved') newStatus = 'APPROVED';
        if (status === 'rejected') newStatus = 'REJECTED';
        if (status === 'refunded') newStatus = 'REFUNDED';

        // Actualizar Pago
        await prisma.payment.updateMany({
          where: { bookingId: externalReference },
          data: { status: newStatus, mpPaymentId: dataId }
        });

        // Actualizar Reserva
        if (newStatus === 'APPROVED') {
          await prisma.booking.update({
            where: { id: externalReference },
            data: { status: 'CONFIRMED' }
          });
        } else if (newStatus === 'REJECTED') {
          await prisma.booking.update({
            where: { id: externalReference },
            data: { status: 'CANCELLED' }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook MP Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
