export async function sendWhatsAppMessage(to: string, text: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    // Usamos la versión de la API que te marca Meta (v25.0 o la que estés usando)
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { preview_url: false, body: text }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Error de Meta Graph API:", data);
            return null;
        }

        console.log("✅ Mensaje enviado correctamente a:", to);
        return data;
    } catch (error) {
        console.error("❌ Error interno enviando mensaje:", error);
        return null;
    }
}