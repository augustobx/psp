import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function TournamentDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      categories: true,
    },
  });

  if (!tournament) {
    notFound();
  }

  const categoryId = tournament.categories[0]?.id;

  // CORRECCIÓN: Se usa tournamentMatch, tal cual está en el schema de Prisma
  const matches = categoryId
    ? await prisma.tournamentMatch.findMany({
      where: { categoryId },
      include: {
        team1: true,
        team2: true,
        winner: true,
      },
      orderBy: [
        { round: 'asc' },
        { matchOrder: 'asc' }
      ]
    })
    : [];

  return (
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
          Torneo: {tournament.name}
        </h1>
        <p className="text-slate-500 mb-8 font-medium">Estado: {tournament.status}</p>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
            Partidos de la Categoría Principal
          </h2>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 border rounded-lg dark:border-slate-600 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.team1?.name || 'TBD'}
                    </span>
                    <span className="text-sm text-slate-400">vs</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.team2?.name || 'TBD'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-500 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
                    Ronda {m.round} | Orden {m.matchOrder}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
              No hay partidos generados para esta categoría todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}