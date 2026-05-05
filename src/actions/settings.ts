"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        return settings;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
}

export async function updateSystemSettings(formData: FormData) {
    try {
        // 1. Switches booleanos capturados correctamente con .has()
        const reservationsEnabled = formData.has("reservationsEnabled"); // Activar/desactivar el sistema de reservas web
        const whatsappReservations = formData.has("whatsappReservations"); // Activar/desactivar reserva por wsp
        const pwaEnabled = formData.has("pwaEnabled"); // Activar/desactivar la PWA
        const autoWhatsapp = formData.has("autoWhatsapp"); // Meta API
        const bubbleActive = formData.has("bubbleActive"); // Activar burbuja de mensaje

        // 2. Textos, números y configuraciones generales
        const clubName = formData.get("clubName") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const reservationFee = Number(formData.get("reservationFee"));
        const mpAccessToken = formData.get("mpAccessToken") as string;
        const theme = formData.get("theme") as string;

        // 3. Splash y Burbuja
        const splashLogo = formData.get("splashLogo") as string;
        const splashName = formData.get("splashName") as string;
        const splashDuration = Number(formData.get("splashDuration"));
        const bubbleText = formData.get("bubbleText") as string;

        await prisma.systemSetting.update({
            where: { id: 1 },
            data: {
                clubName,
                contactPhone,
                reservationFee,
                mpAccessToken,
                theme,
                reservationsEnabled,
                whatsappReservations,
                pwaEnabled,
                autoWhatsapp,
                bubbleActive,
                bubbleText,
                splashLogo,
                splashName,
                splashDuration,
            },
        });

        revalidatePath("/admin/settings");
        revalidatePath("/");

    } catch (error) {
        console.error("Error updating settings:", error);
    }
}