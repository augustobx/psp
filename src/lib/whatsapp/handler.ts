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
                "¡Hola! 👋 Bienvenido al sistema de reservas de Mu San Pedro. ¿Qué querés hacer hoy?",
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

                // Formateo de fecha para mostrar al usuario (DD/MM/YYYY)
                const year = hoy.getFullYear();
                const month = String(hoy.getMonth() + 1).padStart(2, '0');
                const day = String(hoy.getDate()).padStart(2, '0');
                const fechaFormateada = `${day}/${month}/${year}`;

                // Rango del día para filtrar en Prisma (desde las 00:00:00 hasta las 23:59:59)
                const startOfDay = new Date(hoy.setHours(0, 0, 0, 0));
                const endOfDay = new Date(hoy.setHours(23, 59, 59, 999));

                await sendWhatsAppMessage(phone, `Buscando turnos disponibles para hoy (${fechaFormateada})... 🕒`);

                try {
                    // 1. Buscamos todas las canchas usando los nombres correctos de tu schema
                    const canchas = await prisma.court.findMany({
                        where: { isActive: true },
                        include: {
                            businessHours: { // Relación definida en Court: businessHours BusinessHour[]
                                where: { dayOfWeek: hoy.getDay() }
                            },
                            bookings: {      // Relación definida en Court: bookings Booking[]
                                where: {
                                    startTime: { // Campo definido en Booking: startTime DateTime
                                        gte: startOfDay,
                                        lte: endOfDay
                                    },
                                    status: {
                                        // Solo cruzamos con reservas que estén confirmadas o pendientes (no las canceladas)
                                        in: ['PENDING', 'CONFIRMED', 'FIXED']
                                    }
                                }
                            }
                        }
                    });

                    if (canchas.length === 0) {
                        await sendWhatsAppMessage(phone, "Lo siento, no hay canchas activas en este momento. 😢");
                        return;
                    }

                    // 2. Armamos la lista interactiva con los datos de las canchas
                    // Idealmente acá cruzarías businessHours vs bookings para sacar los horarios libres.
                    // Por ahora mostramos las canchas para confirmar que Prisma conecta bien.
                    await sendInteractiveList(
                        phone,
                        "Selecciona una cancha para ver disponibilidad:",
                        "Canchas Disponibles",
                        canchas.map(cancha => ({
                            id: `cancha_${cancha.id}`,
                            title: cancha.name,
                            description: `Deporte: ${cancha.sport}`
                        }))
                    );

                } catch (error) {
                    console.error("Error consultando Prisma:", error);
                    await sendWhatsAppMessage(phone, "Uy, hubo un problema buscando los turnos. Intentá de nuevo en un ratito. 🛠️");
                }

                return;
            }
        }
    }
}