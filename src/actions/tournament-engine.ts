'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Crear una categoría
export async function createCategory(tournamentId: string, name: string, level: number | null, format: any) {
  try {
    await prisma.tournamentCategory.create({
      data: { tournamentId, name, level, format }
    });
    revalidatePath(`/admin/torneos/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al crear categoría' };
  }
}

// Generador de Llaves de Eliminación Directa
export async function generateKnockoutBracket(categoryId: string) {
  try {
    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: { teams: true }
    });

    if (!category || category.teams.length < 2) {
      return { success: false, error: 'Se necesitan al menos 2 parejas.' };
    }

    const teams = category.teams;
    // Calcular potencia de 2 más cercana (ej: 4, 8, 16, 32)
    const numTeams = teams.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numTeams)));
    
    // TODO: Aquí habría una lógica compleja para sortear byes y sembrar parejas.
    // Por simplicidad, crearemos los partidos de Cuartos, Semis, Final, etc.
    // En una app real, el bracket generator calcula exactamente round, matchOrder y nextMatchId.

    // Ejemplo simplificado: crear solo la fase final si son 2 equipos
    if (numTeams === 2) {
      await prisma.tournamentMatch.create({
        data: {
          categoryId,
          round: 1, // Final
          matchOrder: 1,
          team1Id: teams[0].id,
          team2Id: teams[1].id,
          roundName: 'Final'
        }
      });
    } else {
      // Para un generador completo, se construiría el árbol completo
      // insertando matches nulos que se llenan al ganar.
      // Aquí simulamos que se crean
    }

    revalidatePath(`/admin/torneos`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error generando llaves' };
  }
}

// Mesa de control: Actualizar Score
export async function updateMatchScore(matchId: string, scoreTeam1: string, scoreTeam2: string, winnerId: string) {
  try {
    const match = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        scoreTeam1,
        scoreTeam2,
        winnerId,
        status: 'COMPLETED'
      }
    });

    // Si hay nextMatchId, avanzar al ganador a ese partido
    if (match.nextMatchId && winnerId) {
      const nextMatch = await prisma.tournamentMatch.findUnique({ where: { id: match.nextMatchId } });
      if (nextMatch) {
        // Asignarlo al team1 o team2 dependiendo de cuál esté libre
        if (!nextMatch.team1Id) {
          await prisma.tournamentMatch.update({
            where: { id: nextMatch.id },
            data: { team1Id: winnerId }
          });
        } else if (!nextMatch.team2Id) {
          await prisma.tournamentMatch.update({
            where: { id: nextMatch.id },
            data: { team2Id: winnerId }
          });
        }
      }
    }

    revalidatePath('/admin/torneos');
    revalidatePath('/tv'); // Para actualizar el TV Mode
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al actualizar resultado' };
  }
}
