// src/lib/whatsapp/handler.ts
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendInteractiveButtons, sendInteractiveList } from './api';

export async function handleIncomingMessage(phone: string, message: any) {
    const messageType = message.type;

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

    if (messageType === 'interactive') {
        const interactiveType = message.interactive.type;

        if (interactiveType === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;

            if (buttonId === 'btn_ver_turnos') {
                const hoy = new Date();

                // Formateo para mostrarle al usuario
                const year = hoy.getFullYear();
                const month = String(hoy.getMonth() + 1).padStart(2, '0');
                const day = String(hoy.getDate()).padStart(2, '0');
                const fechaFormateada = `${day}/${month}/${year}`;

                // Rango del día para filtrar en Prisma correctamente
                const startOfDay = new Date(hoy.setHours(0, 0, 0, 0));
                const endOfDay = new Date(hoy.setHours(23, 59, 59, 999));

                await sendWhatsAppMessage(phone, `Buscando turnos disponibles para hoy (${fechaFormateada})... 🕒`);

                // 1. Buscamos todas las canchas disponibles
                const canchas = await prisma.court.findMany({
                    where: { isActive: true },
                    include: {
                        schedules: {
                            where: { dayOfWeek: hoy.getDay() }
                        },
                        bookings: {
                            where: {
                                // REEMPLAZAR 'startTime' POR EL NOMBRE DE TU CAMPO EN SCHEMA.PRISMA
                                startTime: {
                                    gte: startOfDay,
                                    lte: endOfDay
                                }
                            }
                        }
                    }
                });

                // 2. Armamos la lista interactiva con los datos de la BD
                await sendInteractiveList(
                    phone,
                    "Selecciona una cancha para ver sus horarios",
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