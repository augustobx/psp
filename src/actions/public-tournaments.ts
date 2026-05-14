'use server';

import { prisma } from '@/lib/prisma';
import { normalizePhoneForWhatsApp } from '@/lib/whatsapp/notifications';

export async function getPublicTournaments() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
      include: {
        categories: true,
      }
    });
    return { success: true, data: tournaments };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al cargar torneos' };
  }
}

export async function getTournamentDetails(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id, isPublished: true },
      include: {
        categories: {
          include: {
            teams: true,
            matches: {
              include: { team1: true, team2: true, winner: true },
              orderBy: [{ round: 'desc' }, { matchOrder: 'asc' }]
            },
            groups: {
              include: {
                teams: { include: { team: true }, orderBy: { points: 'desc' } },
                matches: { include: { team1: true, team2: true } }
              }
            }
          }
        }
      }
    });
    return { success: true, data: tournament };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al cargar el torneo' };
  }
}

export async function registerTeam(tournamentId: string, categoryId: string, data: any) {
  try {
    // Buscar o crear usuarios (Player 1 y 2)
    const phone1 = normalizePhoneForWhatsApp(data.player1Phone);
    const phone2 = data.player2Phone ? normalizePhoneForWhatsApp(data.player2Phone) : null;

    let p1 = await prisma.user.findFirst({ where: { phone: phone1 } });
    if (!p1) p1 = await prisma.user.create({ data: { phone: phone1, name: data.player1Name, role: 'PLAYER', email: `${phone1}@psp.com` } });

    let p2Id = null;
    if (phone2) {
      let p2 = await prisma.user.findFirst({ where: { phone: phone2 } });
      if (!p2) p2 = await prisma.user.create({ data: { phone: phone2, name: data.player2Name, role: 'PLAYER', email: `${phone2}@psp.com` } });
      p2Id = p2.id;
    }

    const team = await prisma.tournamentTeam.create({
      data: {
        categoryId,
        name: data.teamName || `${data.player1Name} / ${data.player2Name}`,
        player1Id: p1.id,
        player2Id: p2Id,
        phone1,
        phone2,
      }
    });

    return { success: true, teamId: team.id };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al inscribir la pareja' };
  }
}
