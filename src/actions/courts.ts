'use server';

import { prisma } from '@/lib/prisma';
import { CourtSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createCourt(data: unknown) {
  const result = CourtSchema.safeParse(data);
  
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  try {
    const court = await prisma.court.create({
      data: result.data
    });

    revalidatePath('/admin/courts');
    revalidatePath('/reservas');
    
    return { success: true, court };
  } catch (error) {
    console.error('Error creando cancha:', error);
    return { success: false, error: 'Error interno del servidor al crear la cancha.' };
  }
}

export async function deleteCourt(id: string) {
  try {
    await prisma.court.delete({ where: { id } });
    revalidatePath('/admin/courts');
    revalidatePath('/reservas');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando cancha:', error);
    return { success: false, error: 'No se pudo eliminar la cancha. Posiblemente tenga reservas asociadas.' };
  }
}
