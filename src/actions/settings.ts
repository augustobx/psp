"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSystemSettings(formData: FormData) {
    try {
        // Obtenemos los valores de los checkboxes. Si existen en el FormData, son true.
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
                // Eliminamos la actualización de plantillas largas de WhatsApp de aquí
            },
        });

        revalidatePath("/admin/settings");
        revalidatePath("/"); // Refresca la vista pública también

        return { success: true, message: "Configuración guardada exitosamente" };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, message: "Hubo un error al guardar la configuración" };
    }
}