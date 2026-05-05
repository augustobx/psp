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
        // 1. Toggles Booleanos (Ahora leemos estrictamente si traen "true")
        const reservationsEnabled = formData.get("reservationsEnabled") === "true";
        const whatsappReservations = formData.get("whatsappReservations") === "true";
        const pwaEnabled = formData.get("pwaEnabled") === "true";
        const autoWhatsapp = formData.get("autoWhatsapp") === "true";
        const bubbleActive = formData.get("bubbleActive") === "true";
        const requireDeposit = formData.get("requireDeposit") === "true";

        // 2. Textos y Números
        const clubName = formData.get("clubName") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const mpAccessToken = formData.get("mpAccessToken") as string;
        const reservationFee = Number(formData.get("reservationFee"));
        const sportEmoji = formData.get("sportEmoji") as string;
        const theme = formData.get("theme") as string;

        // 3. Splash y Burbuja
        const splashLogo = formData.get("splashLogo") as string;
        const splashName = formData.get("splashName") as string;
        const splashDuration = Number(formData.get("splashDuration"));
        const bubbleText = formData.get("bubbleText") as string;
        const bubbleColor = formData.get("bubbleColor") as string;
        const bubbleDuration = Number(formData.get("bubbleDuration"));

        await prisma.systemSetting.update({
            where: { id: 1 },
            data: {
                clubName, contactPhone, mpAccessToken, reservationFee, sportEmoji, theme,
                reservationsEnabled, whatsappReservations, pwaEnabled, autoWhatsapp, requireDeposit,
                splashLogo, splashName, splashDuration,
                bubbleActive, bubbleText, bubbleColor, bubbleDuration
            },
        });

        revalidatePath("/admin/settings");
        revalidatePath("/");

    } catch (error) {
        console.error("Error updating settings:", error);
    }
}