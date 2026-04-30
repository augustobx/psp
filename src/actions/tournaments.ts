'use server';

import { prisma } from '@/lib/prisma';
import { tournamentSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createTournament(data: unknown) {
  // Validamos con el esquema correcto
  const result = tournamentSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { name, startDate, endDate, entryFee } = result.data;

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        startDate,
        endDate,
        entryFee,
        status: 'DRAFT', // El estado inicial por defecto de tu Prisma
      }
    });

    revalidatePath('/admin/tournaments');
    revalidatePath('/torneos');

    return { success: true, tournament };
  } catch (error) {
    console.error('Error creando torneo:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}