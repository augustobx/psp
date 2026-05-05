"use server"

import { prisma } from "@/lib/prisma"; // <-- Cambiado: Agregadas las llaves { }
import { revalidatePath } from "next/cache";

// Restauramos esta función que la necesita el home (page.tsx)
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
        const autoWhatsapp = formData.get("autoWhatsapp") === "on";
        const bubbleActive = formData.get("bubbleActive") === "on";
        const pwaEnabled = formData.get("pwaEnabled") === "on";

        const clubName = formData.get("clubName") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const reservationFee = Number(formData.get("reservationFee"));
        const mpAccessToken = formData.get("mpAccessToken") as string;

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
            },
        });

        revalidatePath("/admin/settings");
        revalidatePath("/");

        return { success: true, message: "Configuración guardada exitosamente" };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, message: "Hubo un error al guardar la configuración" };
    }
}