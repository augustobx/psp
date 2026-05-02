// src/lib/whatsapp/handler.ts
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendInteractiveButtons, sendInteractiveList } from './api';

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
                const hoy = new Date();

                // Formateo nativo de fecha a YYYY-MM-DD sin librerías extra
                const year = hoy.getFullYear();
                const month = String(hoy.getMonth() + 1).padStart(2, '0');
                const day = String(hoy.getDate()).padStart(2, '0');
                const fechaFormateada = `${year}-${month}-${day}`;

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
                            // Asumiendo que guardás la fecha en un formato compatible o reseteando la hora
                            where: { date: hoy }
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