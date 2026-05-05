// src/lib/whatsapp/handler.ts
// Handler principal del bot de WhatsApp para PSP Padel Club.
// Implementa una máquina de estados conversacional completa para reservar canchas.

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendInteractiveButtons, sendInteractiveList } from './api';
import { getSession, updateSession, clearSession, cleanupSessions } from './session';
import { getAvailableSlotsForDate } from './slots';

// ============================================================================
// HELPERS
// ============================================================================

/** Formatea una fecha a "DD/MM/YYYY" */
function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/** Devuelve "YYYY-MM-DD" para hoy, mañana o pasado mañana */
function getDateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Busca o crea un User por número de teléfono */
async function findOrCreateUser(phone: string): Promise<string> {
    // Intentar buscar por teléfono exacto
    let user = await prisma.user.findFirst({
        where: { phone },
    });

    if (!user) {
        // Crear usuario nuevo con datos mínimos
        user = await prisma.user.create({
            data: {
                email: `wa_${phone}@whatsapp.local`,
                phone,
                name: `WhatsApp ${phone.slice(-4)}`,
                role: 'PLAYER',
            },
        });
        console.log(`👤 Nuevo usuario creado para WhatsApp: ${phone}`);
    }

    return user.id;
}

/** Obtiene el precio por turno desde SystemSetting */
async function getReservationFee(): Promise<number> {
    const settings = await prisma.systemSetting.findUnique({
        where: { id: 1 },
    });
    return settings?.reservationFee ?? 0;
}

// Limpieza periódica de sesiones viejas (cada 5 min en el ciclo del proceso)
let lastCleanup = 0;
function maybeCleanupSessions() {
    const now = Date.now();
    if (now - lastCleanup > 5 * 60 * 1000) {
        cleanupSessions();
        lastCleanup = now;
    }
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================
export async function handleIncomingMessage(phone: string, message: any) {
    maybeCleanupSessions();

    const messageType = message.type;
    const session = getSession(phone);

    // ========================================================================
    // 1. MENSAJES DE TEXTO — Saludo / Reset
    // ========================================================================
    if (messageType === 'text') {
        const text = message.text.body.toLowerCase().trim();

        if (
            text.includes('hola') ||
            text.includes('turno') ||
            text.includes('reserva') ||
            text.includes('cancha') ||
            text === 'menu' ||
            text === 'menú'
        ) {
            clearSession(phone);
            await sendMainMenu(phone);
            return;
        }

        // Mensaje desconocido
        await sendWhatsAppMessage(
            phone,
            '¡Hola! 👋 Escribí *"hola"* o *"turno"* para empezar a reservar.'
        );
        return;
    }

    // ========================================================================
    // 2. RESPUESTAS INTERACTIVAS (Botones y Listas)
    // ========================================================================
    if (messageType === 'interactive') {
        const interactiveType = message.interactive.type;

        // --------------------------------------------------------------------
        // A. BOTONES
        // --------------------------------------------------------------------
        if (interactiveType === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            await handleButtonReply(phone, buttonId);
            return;
        }

        // --------------------------------------------------------------------
        // B. LISTAS
        // --------------------------------------------------------------------
        if (interactiveType === 'list_reply') {
            const listId = message.interactive.list_reply.id;
            const listTitle = message.interactive.list_reply.title;
            await handleListReply(phone, listId, listTitle);
            return;
        }
    }
}

// ============================================================================
// MENÚ PRINCIPAL
// ============================================================================
async function sendMainMenu(phone: string) {
    await sendInteractiveButtons(
        phone,
        '¡Hola! 👋 Bienvenido a *PSP Padel Club*.\n¿Qué querés hacer hoy?',
        [
            { id: 'btn_reservar', title: '🎾 Reservar Turno' },
            { id: 'btn_mis_reservas', title: '📋 Mis Reservas' },
        ]
    );
}

// ============================================================================
// BOTONES
// ============================================================================
async function handleButtonReply(phone: string, buttonId: string) {
    // ----- RESERVAR TURNO → Elegir fecha -----
    if (buttonId === 'btn_reservar') {
        updateSession(phone, { step: 'CHOOSING_DATE' });

        await sendInteractiveButtons(phone, '📅 ¿Para qué día querés reservar?', [
            { id: 'date_hoy', title: '📌 Hoy' },
            { id: 'date_manana', title: '📌 Mañana' },
            { id: 'date_pasado', title: '📌 Pasado Mañana' },
        ]);
        return;
    }

    // ----- ELEGIR FECHA → Mostrar canchas -----
    if (buttonId.startsWith('date_')) {
        let dateStr: string;
        let dateLabel: string;

        switch (buttonId) {
            case 'date_hoy':
                dateStr = getDateOffset(0);
                dateLabel = 'Hoy';
                break;
            case 'date_manana':
                dateStr = getDateOffset(1);
                dateLabel = 'Mañana';
                break;
            case 'date_pasado':
                dateStr = getDateOffset(2);
                dateLabel = 'Pasado Mañana';
                break;
            default:
                dateStr = getDateOffset(0);
                dateLabel = 'Hoy';
        }

        updateSession(phone, {
            step: 'CHOOSING_COURT',
            date: dateStr,
            dateLabel,
        });

        await sendWhatsAppMessage(
            phone,
            `🔍 Buscando canchas disponibles para *${dateLabel}* (${formatDate(dateStr)})...`
        );

        try {
            const canchas = await prisma.court.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });

            if (canchas.length === 0) {
                await sendWhatsAppMessage(
                    phone,
                    'Lo siento, no hay canchas activas en este momento. 😢'
                );
                clearSession(phone);
                return;
            }

            await sendInteractiveList(
                phone,
                `Seleccioná una cancha para ver los horarios libres del *${dateLabel}*:`,
                'Ver Canchas',
                '🎾 Canchas Disponibles',
                canchas.map(c => ({
                    id: `cancha_${c.id}`,
                    title: c.name,
                    description: `Deporte: ${c.sport}`,
                }))
            );
        } catch (error) {
            console.error('❌ Error consultando canchas:', error);
            await sendWhatsAppMessage(
                phone,
                'Uy, hubo un problema buscando las canchas. Intentá de nuevo en un ratito. 🛠️'
            );
            clearSession(phone);
        }

        return;
    }

    // ----- CONFIRMAR RESERVA -----
    if (buttonId === 'btn_confirmar') {
        const session = getSession(phone);

        if (session.step !== 'CONFIRMING' || !session.courtId || !session.date || !session.slotTime || !session.slotEnd) {
            await sendWhatsAppMessage(phone, 'La sesión expiró. Escribí *"hola"* para empezar de nuevo. ⏰');
            clearSession(phone);
            return;
        }

        try {
            // 1. Buscar o crear usuario
            const userId = await findOrCreateUser(phone);

            // 2. Verificar que el slot siga disponible (race condition check)
            const startTime = new Date(`${session.date}T${session.slotTime}:00`);
            const endTime = new Date(`${session.date}T${session.slotEnd}:00`);

            const existing = await prisma.booking.findFirst({
                where: {
                    courtId: session.courtId,
                    status: { in: ['PENDING', 'CONFIRMED', 'FIXED'] },
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                },
            });

            if (existing) {
                await sendWhatsAppMessage(
                    phone,
                    '😔 ¡Ups! Alguien reservó este turno justo antes que vos. Intentá con otro horario.'
                );
                clearSession(phone);
                await sendMainMenu(phone);
                return;
            }

            // 3. Obtener precio
            const fee = await getReservationFee();

            // 4. Crear la reserva
            const booking = await prisma.booking.create({
                data: {
                    courtId: session.courtId,
                    userId,
                    startTime,
                    endTime,
                    totalAmount: fee,
                    status: 'PENDING',
                    description: `Reserva vía WhatsApp - ${phone}`,
                },
                include: { court: true },
            });

            // 5. Confirmar al usuario
            const priceText = fee > 0 ? `\n💰 *Precio:* $${fee.toLocaleString('es-AR')}` : '';

            await sendWhatsAppMessage(
                phone,
                `✅ *¡Turno reservado con éxito!*\n\n` +
                `📍 *Cancha:* ${booking.court.name}\n` +
                `📅 *Fecha:* ${formatDate(session.date)}\n` +
                `🕐 *Horario:* ${session.slotTime} - ${session.slotEnd}` +
                priceText +
                `\n📌 *Estado:* Pendiente de confirmación\n\n` +
                `¡Te esperamos! 🎾`
            );

            console.log(`🎾 Nueva reserva vía WhatsApp: ${booking.id} | ${phone} | ${session.courtName} | ${session.date} ${session.slotTime}`);

            clearSession(phone);
        } catch (error) {
            console.error('❌ Error creando reserva:', error);
            await sendWhatsAppMessage(
                phone,
                'Uy, hubo un problema al confirmar tu reserva. Intentá de nuevo. 🛠️'
            );
            clearSession(phone);
        }

        return;
    }

    // ----- CANCELAR RESERVA EN PROGRESO -----
    if (buttonId === 'btn_cancelar') {
        clearSession(phone);
        await sendWhatsAppMessage(
            phone,
            'Reserva cancelada. ¡No hay drama! 😊\nEscribí *"hola"* cuando quieras reservar.'
        );
        return;
    }

    // ----- MIS RESERVAS -----
    if (buttonId === 'btn_mis_reservas') {
        await handleMisReservas(phone);
        return;
    }

    // ----- VOLVER AL MENÚ -----
    if (buttonId === 'btn_volver') {
        clearSession(phone);
        await sendMainMenu(phone);
        return;
    }
}

// ============================================================================
// LISTAS
// ============================================================================
async function handleListReply(phone: string, listId: string, listTitle: string) {
    const session = getSession(phone);

    // ----- ELIGIÓ UNA CANCHA → Mostrar horarios libres -----
    if (listId.startsWith('cancha_')) {
        const courtId = listId.replace('cancha_', '');

        if (!session.date) {
            await sendWhatsAppMessage(phone, 'La sesión expiró. Escribí *"hola"* para empezar de nuevo. ⏰');
            clearSession(phone);
            return;
        }

        updateSession(phone, {
            step: 'CHOOSING_SLOT',
            courtId,
            courtName: listTitle,
        });

        await sendWhatsAppMessage(
            phone,
            `🔍 Buscando horarios libres en *${listTitle}* para el *${session.dateLabel}*...`
        );

        try {
            const slots = await getAvailableSlotsForDate(courtId, session.date);

            if (slots.length === 0) {
                await sendWhatsAppMessage(
                    phone,
                    `😔 No hay horarios disponibles en *${listTitle}* para el *${session.dateLabel}*.\n\nProbá con otra cancha o fecha.`
                );
                await sendInteractiveButtons(phone, '¿Qué querés hacer?', [
                    { id: 'btn_reservar', title: '🔄 Otra fecha' },
                    { id: 'btn_volver', title: '🏠 Menú' },
                ]);
                return;
            }

            // Meta limita a 10 filas por sección
            const slotsToShow = slots.slice(0, 10);

            await sendInteractiveList(
                phone,
                `Horarios libres en *${listTitle}* para el *${session.dateLabel}* (${formatDate(session.date)}):`,
                'Ver Horarios',
                `🕐 Horarios - ${listTitle}`,
                slotsToShow.map(slot => ({
                    id: `slot_${slot.time.replace(':', '')}`,
                    title: slot.label,
                    description: `Turno de ${session.courtName}`,
                }))
            );
        } catch (error) {
            console.error('❌ Error calculando slots:', error);
            await sendWhatsAppMessage(
                phone,
                'Uy, hubo un problema buscando los horarios. Intentá de nuevo. 🛠️'
            );
            clearSession(phone);
        }

        return;
    }

    // ----- ELIGIÓ UN HORARIO → Pedir confirmación -----
    if (listId.startsWith('slot_')) {
        const timeRaw = listId.replace('slot_', ''); // "1430"
        const slotTime = `${timeRaw.substring(0, 2)}:${timeRaw.substring(2)}`;

        if (!session.courtId || !session.date) {
            await sendWhatsAppMessage(phone, 'La sesión expiró. Escribí *"hola"* para empezar de nuevo. ⏰');
            clearSession(phone);
            return;
        }

        // Calcular hora de fin usando el slotDuration de businessHour
        const targetDate = new Date(`${session.date}T00:00:00`);
        const dayOfWeek = targetDate.getDay();

        const businessHour = await prisma.businessHour.findFirst({
            where: { courtId: session.courtId, dayOfWeek },
        });

        const duration = businessHour?.slotDuration ?? 90;
        const [h, m] = slotTime.split(':').map(Number);
        const endMinutes = h * 60 + m + duration;
        const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
        const endM = (endMinutes % 60).toString().padStart(2, '0');
        const slotEnd = `${endH}:${endM}`;

        updateSession(phone, {
            step: 'CONFIRMING',
            slotTime,
            slotEnd,
        });

        // Obtener precio
        const fee = await getReservationFee();
        const priceText = fee > 0 ? `\n💰 *Precio:* $${fee.toLocaleString('es-AR')}` : '';

        await sendInteractiveButtons(
            phone,
            `📋 *Resumen de tu reserva:*\n\n` +
            `📍 *Cancha:* ${session.courtName}\n` +
            `📅 *Fecha:* ${session.dateLabel} (${formatDate(session.date)})\n` +
            `🕐 *Horario:* ${slotTime} - ${slotEnd}` +
            priceText +
            `\n\n¿Confirmamos? 🎾`,
            [
                { id: 'btn_confirmar', title: '✅ Confirmar' },
                { id: 'btn_cancelar', title: '❌ Cancelar' },
            ]
        );
        return;
    }
}

// ============================================================================
// MIS RESERVAS
// ============================================================================
async function handleMisReservas(phone: string) {
    try {
        // Buscar usuario por teléfono
        const user = await prisma.user.findFirst({
            where: { phone },
        });

        if (!user) {
            await sendWhatsAppMessage(
                phone,
                'No encontramos reservas asociadas a tu número. 🤔\nReservá tu primer turno escribiendo *"hola"*.'
            );
            return;
        }

        // Buscar reservas futuras
        const now = new Date();
        const bookings = await prisma.booking.findMany({
            where: {
                userId: user.id,
                startTime: { gte: now },
                status: { in: ['PENDING', 'CONFIRMED'] },
            },
            include: { court: true },
            orderBy: { startTime: 'asc' },
            take: 5,
        });

        if (bookings.length === 0) {
            await sendWhatsAppMessage(
                phone,
                'No tenés reservas pendientes. 📭\nEscribí *"hola"* para reservar un turno.'
            );
            return;
        }

        let msg = '📋 *Tus próximas reservas:*\n\n';

        bookings.forEach((b, i) => {
            const fecha = b.startTime.toLocaleDateString('es-AR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
            });
            const horaInicio = b.startTime.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
            const horaFin = b.endTime.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
            const statusEmoji = b.status === 'CONFIRMED' ? '✅' : '⏳';

            msg += `${i + 1}. ${statusEmoji} *${b.court.name}*\n`;
            msg += `   📅 ${fecha} | 🕐 ${horaInicio} - ${horaFin}\n\n`;
        });

        await sendWhatsAppMessage(phone, msg);
        await sendInteractiveButtons(phone, '¿Qué más querés hacer?', [
            { id: 'btn_reservar', title: '🎾 Reservar Turno' },
            { id: 'btn_volver', title: '🏠 Menú' },
        ]);
    } catch (error) {
        console.error('❌ Error buscando reservas del usuario:', error);
        await sendWhatsAppMessage(
            phone,
            'Hubo un problema buscando tus reservas. Intentá de nuevo. 🛠️'
        );
    }
}