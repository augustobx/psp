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
        // Lectura nativa de HTML: los checkboxes marcados envían "on", los desmarcados envían null.
        const reservationsEnabled = formData.get("reservationsEnabled") === "on";
        const whatsappReservations = formData.get("whatsappReservations") === "on";
        const pwaEnabled = formData.get("pwaEnabled") === "on";
        const autoWhatsapp = formData.get("autoWhatsapp") === "on";
        const bubbleActive = formData.get("bubbleActive") === "on";
        const requireDeposit = formData.get("requireDeposit") === "on";

        // Textos y números con fallbacks para evitar que explote si vienen vacíos
        const clubName = (formData.get("clubName") as string) || "";
        const topbarName = (formData.get("topbarName") as string) || "";
        const contactPhone = (formData.get("contactPhone") as string) || "";
        const mpAccessToken = (formData.get("mpAccessToken") as string) || "";
        const reservationFee = Number(formData.get("reservationFee")) || 0;
        const sportEmoji = (formData.get("sportEmoji") as string) || "🎾";
        const theme = (formData.get("theme") as string) || "light";

        // Splash y Burbuja
        const splashLogo = (formData.get("splashLogo") as string) || "";
        const splashName = (formData.get("splashName") as string) || "";
        const splashDuration = Number(formData.get("splashDuration")) || 3000;
        const bubbleText = (formData.get("bubbleText") as string) || "";
        const bubbleColor = (formData.get("bubbleColor") as string) || "#10b981";
        const bubbleDuration = Number(formData.get("bubbleDuration")) || 3000;

        await prisma.systemSetting.update({
            where: { id: 1 },
            data: {
                clubName, topbarName, contactPhone, mpAccessToken, reservationFee, sportEmoji, theme,
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