// src/lib/whatsapp/api.ts
// Todas las funciones leen process.env en RUNTIME (no al import)

function getConfig() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        throw new Error('❌ Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_ID en .env');
    }

    return {
        url: `https://graph.facebook.com/v20.0/${phoneId}/messages`,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
}

// ============================================================================
// ENVIAR MENSAJE DE TEXTO SIMPLE
// ============================================================================
export async function sendWhatsAppMessage(to: string, body: string) {
    const { url, headers } = getConfig();

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error de Meta Graph API (text):', JSON.stringify(data));
            return null;
        }

        console.log('✅ Texto enviado a:', to);
        return data;
    } catch (error) {
        console.error('❌ Error interno enviando texto:', error);
        return null;
    }
}

// ============================================================================
// ENVIAR BOTONES INTERACTIVOS (Máximo 3 permitidos por Meta)
// ============================================================================
export async function sendInteractiveButtons(
    to: string,
    text: string,
    buttons: { id: string; title: string }[]
) {
    const { url, headers } = getConfig();

    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text },
            action: {
                buttons: buttons.map(btn => ({
                    type: 'reply',
                    reply: { id: btn.id, title: btn.title },
                })),
            },
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error de Meta Graph API (buttons):', JSON.stringify(data));
            return null;
        }

        console.log('✅ Botones enviados a:', to);
        return data;
    } catch (error) {
        console.error('❌ Error interno enviando botones:', error);
        return null;
    }
}

// ============================================================================
// ENVIAR LISTA INTERACTIVA (Hasta 10 opciones por sección)
// ============================================================================
export async function sendInteractiveList(
    to: string,
    bodyText: string,
    buttonTitle: string,
    headerText: string,
    rows: { id: string; title: string; description?: string }[]
) {
    const { url, headers } = getConfig();

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: headerText },
            body: { text: bodyText },
            footer: { text: 'PSP Padel Club 🎾' },
            action: {
                button: buttonTitle,
                sections: [
                    {
                        title: 'Opciones',
                        rows: rows.map(row => ({
                            id: row.id,
                            title: row.title.substring(0, 24), // Meta limita a 24 chars
                            description: row.description?.substring(0, 72) || '',
                        })),
                    },
                ],
            },
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error de Meta Graph API (list):', JSON.stringify(data));
            return null;
        }

        console.log('✅ Lista enviada a:', to);
        return data;
    } catch (error) {
        console.error('❌ Error interno enviando lista:', error);
        return null;
    }
}