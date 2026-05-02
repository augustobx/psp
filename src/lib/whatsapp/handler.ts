// src/lib/whatsapp/handler.ts
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendInteractiveButtons, sendInteractiveList } from './api';
import { format } from 'date-format-parse'; // Necesitás una librería para formatear fechas, ej: date-format-parse

export async function handleIncomingMessage(phone: string, message: any) {
    const messageType = message.type;

    // ... (Mantener la lógica inicial del "Hola") ...

    // 2. Si el usuario tocó un botón interactivo
    if (messageType === 'interactive') {
        const interactiveType = message.interactive.type;

        if (interactiveType === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;

            if (buttonId === 'btn_ver_turnos') {
                const hoy = new Date();
                const fechaFormateada = format(hoy, 'YYYY-MM-DD');

                await sendWhatsAppMessage(phone, `Buscando turnos disponibles para hoy (${fechaFormateada})... 🕒`);

                // AHORA INTEGRAMOS CON PRISMA DE VERDAD
                // 1. Buscamos todas las canchas disponibles
                const canchas = await prisma.court.findMany({
                    where: { isActive: true },
                    include: {
                        schedules: { // Y sus horarios
                            where: { dayOfWeek: hoy.getDay() } // Del día de hoy
                        },
                        bookings: { // Y las reservas de hoy para cruzarlas
                            where: { date: hoy } // Asumiendo que Prisma maneja el Date así en el where
                        }
                    }
                });

                // 2. Lógica para filtrar horarios que NO estén reservados (esto es complejo y depende de tu esquema)
                // Por ahora, para probar, enviamos una lista genérica

                await sendInteractiveList(
                    phone,
                    "Selecciona una cancha",
                    "Canchas Disponibles",
                    canchas.map(cancha => ({
                        id: `cancha_${cancha.id}`,
                        title: cancha.name,
                        description: `${cancha.type} - Desde $${cancha.priceHour}`
                    }))
                );

                return;
            }
        }
    }
}