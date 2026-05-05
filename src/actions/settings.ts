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
        // La forma correcta y robusta de leer checkboxes en Server Actions:
        // Si está marcado, "has" devuelve true. Si está desmarcado, devuelve false.
        const autoWhatsapp = formData.has("autoWhatsapp");
        const bubbleActive = formData.has("bubbleActive");
        const pwaEnabled = formData.has("pwaEnabled");

        const clubName = formData.get("clubName") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const reservationFee = Number(formData.get("reservationFee"));
        const mpAccessToken = formData.get("mpAccessToken") as string;
        const theme = formData.get("theme") as string;

        // Capturamos las variables del Splash Screen
        const splashLogo = formData.get("splashLogo") as string;
        const splashDuration = Number(formData.get("splashDuration"));

        await prisma.systemSetting.update({
            where: { id: 1 },
            data: {
                clubName,
                contactPhone,
                reservationFee,
                mpAccessToken,
                autoWhatsapp,
                bubbleActive,
                pwaEnabled,
                theme,
                splashLogo,
                splashDuration,
            },
        });

        revalidatePath("/admin/settings");
        revalidatePath("/");

    } catch (error) {
        console.error("Error updating settings:", error);
    }
}