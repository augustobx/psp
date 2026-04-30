'use server';

import { prisma } from '@/lib/prisma';
import { TournamentSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function createTournament(data: unknown) {
  const result = TournamentSchema.safeParse(data);
  
  if (!result.success) {
    return { success: false, error: result.error.flatten() };
  }

  const { name, startDate, endDate } = result.data;

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'DRAFT'
      }
    });

    revalidatePath('/admin/tournaments');
    return { success: true, tournament };
  } catch (error) {
    console.error('Error creando torneo:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function generateBracket(categoryId: string) {
  try {
    // 1. Obtener participantes confirmados
    const participants = await prisma.tournamentParticipant.findMany({
      where: { categoryId, status: 'CONFIRMED' }
    });

    if (participants.length < 2) {
      return { success: false, error: 'No hay suficientes participantes para generar llaves.' };
    }

    // 2. Limpiar partidos anteriores de la categoría
    await prisma.match.deleteMany({ where: { categoryId } });

    // 3. Algoritmo simple de emparejamiento aleatorio para 1ra ronda
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const round = 1; // 1 = Cuartos, 2 = Semi, etc (dependiendo de la cantidad real, para este MVP asumiremos ronda inicial como 1)
    
    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i + 1];

      await prisma.match.create({
        data: {
          categoryId,
          round,
          player1Id: p1.userId,
          player2Id: p2 ? p2.userId : null, // Si p2 no existe, p1 pasa directo (Bye)
          status: 'SCHEDULED'
        }
      });
    }

    revalidatePath('/admin/tournaments');
    return { success: true };
  } catch (error) {
    console.error('Error generando brackets:', error);
    return { success: false, error: 'Error al generar llaves.' };
  }
}
