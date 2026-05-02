// src/app/api/webhooks/whatsapp/route.ts
import { NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/lib/whatsapp/handler';

// El GET (queda igual, para cuando Meta verifica)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return new Response('Error de validación', { status: 403 });
}

// El POST (acá está la posta)
export async function POST(request: Request) {
    console.log("=========================================");
    console.log("🟢 🟢 LLEGÓ UN WEBHOOK DE META 🟢 🟢");

    try {
        const body = await request.json();
        console.log(JSON.stringify(body, null, 2)); // Imprimimos todo el body
        console.log("=========================================");

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            const phone = message?.from;

            if (message) {
                console.log(`📩 Hay un mensaje de texto/interactivo del número: ${phone}`);
                await handleIncomingMessage(phone, message);
            } else {
                console.log("⚠️ El webhook llegó pero no tiene ningún 'message' adentro (puede ser una confirmación de lectura o estado).");
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('❌ Error grave procesando el webhook:', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}