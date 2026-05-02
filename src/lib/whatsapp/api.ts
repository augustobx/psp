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

    console.log(`Intentando responder a ${to}...`); // Aviso en consola

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Si Meta nos tira bronca, lo imprimimos
        if (data.error) {
            console.error("❌ ERROR DE META AL RESPONDER:", data.error);
        } else {
            console.log("✅ Mensaje enviado con éxito a Meta:", data);
        }
    } catch (error) {
        console.error("❌ Error grave en el servidor:", error);
    }
}

// Enviar una lista interactiva (Mensaje de lista, hasta 10 opciones por sección)
export async function sendInteractiveList(
    to: string,
    bodyText: string,
    buttonTitle: string, // El texto del botón principal que abre la lista
    sectionsRows: { id: string, title: string, description: string }[]
) {
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: 'Reservas Disponibles' },
            body: { text: bodyText },
            footer: { text: 'Selecciona una opción para continuar' },
            action: {
                button: buttonTitle,
                sections: [{
                    title: 'Horarios Hoy',
                    rows: sectionsRows.map(row => ({
                        id: row.id,
                        title: row.title,
                        description: row.description
                    }))
                }]
            }
        }
    };

    await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload),
    });
}