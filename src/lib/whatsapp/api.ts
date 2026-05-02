// src/lib/whatsapp/api.ts

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const HEADERS = {
    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
};

// Enviar un mensaje de texto simple
export async function sendWhatsAppMessage(to: string, body: string) {
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { preview_url: false, body: body }
    };

    await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload),
    });
}

// Enviar botones interactivos (Máximo 3 botones permitidos por Meta)
export async function sendInteractiveButtons(to: string, text: string, buttons: { id: string, title: string }[]) {
    const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: text },
            action: {
                buttons: buttons.map(btn => ({
                    type: 'reply',
                    reply: {
                        id: btn.id,
                        title: btn.title
                    }
                }))
            }
        }
    };

    await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload),
    });
}