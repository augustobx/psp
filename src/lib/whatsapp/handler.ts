// src/lib/whatsapp/handler.ts
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, sendInteractiveButtons } from './api';

export async function handleIncomingMessage(phone: string, message: any) {
    const messageType = message.type;

    // 1. Si el usuario manda un texto normal (ej: "Hola", "Quiero un turno")
    if (messageType === 'text') {
        const text = message.text.body.toLowerCase();

        if (text.includes('hola') || text.includes('turno')) {
            await sendInteractiveButtons(
                phone,
                "¡Hola! 👋 Bienvenido al sistema de reservas del club. ¿Qué querés hacer hoy?",
                [
                    { id: 'btn_ver_turnos', title: 'Ver Turnos Hoy' },
                    { id: 'btn_mis_reservas', title: 'Mis Reservas' }
                ]
            );
            return;
        }
    }

    // 2. Si el usuario tocó un botón interactivo
    if (messageType === 'interactive') {
        const interactiveType = message.interactive.type;

        if (interactiveType === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;

            if (buttonId === 'btn_ver_turnos') {
                // Acá consultarías a Prisma por los turnos reales
                // const turnosDisponibles = await prisma.court.findMany({...});

                await sendWhatsAppMessage(
                    phone,
                    "Buscando turnos disponibles para hoy... 🕒\n\n(Acá integraríamos una lista interactiva de la API de Meta con los horarios de Prisma)"
                );
                // Siguiente paso: Armar y enviar una Interactive List Message con los horarios.
            }
        }
    }
}