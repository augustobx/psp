"use server";

import { prisma } from "@/lib/prisma";
import { courtSchema, CourtInput, businessHourSchema, BusinessHourInput } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- 1. OBTENER CANCHAS Y HORARIOS ---
export async function getCourts() {
  try {
    const courts = await prisma.court.findMany({
      include: {
        businessHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: courts };
  } catch (error) {
    console.error("Error fetching courts:", error);
    return { success: false, error: "Error interno al obtener las canchas" };
  }
}

// --- 2. ABM DE CANCHA ---
export async function upsertCourt(id: string | null, payload: CourtInput) {
  const parsed = courtSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Datos de cancha inválidos" };
  }

  try {
    const court = id
      ? await prisma.court.update({ where: { id }, data: parsed.data })
      : await prisma.court.create({ data: parsed.data });

    revalidatePath("/admin/courts");
    revalidatePath("/admin/calendar"); // Revalidamos el calendario por si cambió el nombre/estado
    return { success: true, data: court };
  } catch (error) {
    console.error("Error upserting court:", error);
    return { success: false, error: "Error al guardar la cancha en la base de datos" };
  }
}

// --- 3. CONFIGURAR HORARIOS DE ATENCIÓN ---
export async function upsertBusinessHours(courtId: string, payload: BusinessHourInput[]) {
  const parsed = z.array(businessHourSchema).safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Formato de horarios inválido" };
  }

  try {
    // Transacción: Borramos los horarios anteriores de esa cancha y guardamos los nuevos
    // Esto evita duplicados o conflictos de Primary Key
    await prisma.$transaction([
      prisma.businessHour.deleteMany({ where: { courtId } }),
      prisma.businessHour.createMany({ data: parsed.data })
    ]);

    revalidatePath("/admin/courts");
    revalidatePath("/admin/calendar"); // Vital para que la grilla de turnos se regenere
    return { success: true };
  } catch (error) {
    console.error("Error saving business hours:", error);
    return { success: false, error: "Error al actualizar los horarios de la cancha" };
  }
}

// --- 4. TOGGLE ESTADO (Activar/Desactivar) ---
export async function toggleCourtStatus(id: string, isActive: boolean) {
  try {
    await prisma.court.update({
      where: { id },
      data: { isActive }
    });

    revalidatePath("/admin/courts");
    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error) {
    console.error("Error toggling court status:", error);
    return { success: false, error: "Error al cambiar el estado de la cancha" };
  }
}