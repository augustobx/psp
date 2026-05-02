// src/app/api/webhooks/whatsapp/route.ts
import { NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/lib/whatsapp/handler'; // Lo creamos en el Paso 4

// Meta hace un GET a este endpoint para verificar el webhook
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook de WhatsApp verificado correctamente.');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Error de validación', { status: 403 });
}

// Meta hace un POST acá cada vez que alguien escribe al bot
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Verificamos que sea un evento de WhatsApp
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            // Obtenemos el número del cliente
            const phone = message?.from;

            if (message) {
                // Derivamos la lógica del bot a un handler externo para mantener el código limpio
                await handleIncomingMessage(phone, message);
            }
        }

        // Siempre hay que devolver un 200 OK rápido a Meta para que no reintente enviar el mensaje
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Error procesando webhook de WSAP:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}