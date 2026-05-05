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

        // Eliminamos los "return { success... }" para que la función sea Promise<void>
    } catch (error) {
        console.error("Error updating settings:", error);
    }
}