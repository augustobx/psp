// src/lib/whatsapp/handler.ts
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendInteractiveButtons, sendInteractiveList } from './api';

export async function handleIncomingMessage(phone: string, message: any) {
    const messageType = message.type;

    // ============================================================================
    // 1. MANEJO DE MENSAJES DE TEXTO PURO
    // ============================================================================
    if (messageType === 'text') {
        const text = message.text.body.toLowerCase();

        // Si saluda o pide turno, disparamos el menú principal
        if (text.includes('hola') || text.includes('turno')) {
            await sendInteractiveButtons(
                phone,
                "¡Hola! 👋 Bienvenido al sistema de reservas de PSP Padel Club. ¿Qué querés hacer hoy?",
                [
                    { id: 'btn_ver_turnos', title: 'Ver Turnos Hoy' },
                    { id: 'btn_mis_reservas', title: 'Mis Reservas' }
                ]
            );
            return;
        }
    }

    // ============================================================================
    // 2. MANEJO DE RESPUESTAS INTERACTIVAS (Botones y Listas)
    // ============================================================================
    if (messageType === 'interactive') {
        const interactiveType = message.interactive.type;

        // ------------------------------------------------------------------------
        // A. CUANDO EL USUARIO TOCA UN BOTÓN
        // ------------------------------------------------------------------------
        if (interactiveType === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;

            if (buttonId === 'btn_ver_turnos') {
                const hoy = new Date();

                // Formateo de fecha para mostrar al usuario (DD/MM/YYYY)
                const year = hoy.getFullYear();
                const month = String(hoy.getMonth() + 1).padStart(2, '0');
                const day = String(hoy.getDate()).padStart(2, '0');
                const fechaFormateada = `${day}/${month}/${year}`;

                // Rango del día para filtrar en Prisma (00:00:00 a 23:59:59)
                const startOfDay = new Date(hoy.setHours(0, 0, 0, 0));
                const endOfDay = new Date(hoy.setHours(23, 59, 59, 999));

                await sendWhatsAppMessage(phone, `Buscando turnos disponibles para hoy (${fechaFormateada})... 🕒`);

                try {
                    // Buscamos todas las canchas activas cruzando con horarios y reservas de hoy
                    const canchas = await prisma.court.findMany({
                        where: { isActive: true },
                        include: {
                            businessHours: {
                                where: { dayOfWeek: hoy.getDay() }
                            },
                            bookings: {
                                where: {
                                    startTime: {
                                        gte: startOfDay,
                                        lte: endOfDay
                                    },
                                    status: {
                                        // Solo traemos las que ocupan lugar
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

                    // Armamos la lista interactiva con las canchas traídas de la DB
                    await sendInteractiveList(
                        phone,
                        "Seleccioná una cancha para ver los horarios libres:",
                        "Ver Canchas",
                        canchas.map(cancha => ({
                            id: `cancha_${cancha.id}`,
                            title: cancha.name,
                            description: `Deporte: ${cancha.sport}`
                        }))
                    );

                } catch (error) {
                    console.error("❌ Error consultando Prisma:", error);
                    await sendWhatsAppMessage(phone, "Uy, hubo un problema buscando los turnos. Intentá de nuevo en un ratito. 🛠️");
                }

                return;
            }

            if (buttonId === 'btn_mis_reservas') {
                await sendWhatsAppMessage(phone, "Acá próximamente buscaremos tus reservas en la base de datos... 🚧");
                return;
            }
        }

        // ------------------------------------------------------------------------
        // B. CUANDO EL USUARIO ELIGE UNA OPCIÓN DE UNA LISTA
        // ------------------------------------------------------------------------
        if (interactiveType === 'list_reply') {
            const listId = message.interactive.list_reply.id; // Ej: "cancha_1"
            const listTitle = message.interactive.list_reply.title; // Ej: "Cancha de Cristal"

            // Si el ID de la lista empieza con "cancha_", sabemos que eligió una
            if (listId.startsWith('cancha_')) {
                const canchaIdStr = listId.split('_')[1];

                // Acá ya tenemos el ID real de la cancha en la base de datos
                await sendWhatsAppMessage(
                    phone,
                    `¡Excelente! Elegiste la *${listTitle}*. \n\nAhora tendríamos que calcular los bloques horarios libres (1h o 1.5h) cruzando los businessHours con las bookings, y mostrarle otra lista con las horas.`
                );
                return;
            }
        }
    }
}