import { prisma } from '@/lib/prisma';
import TournamentBracket from '@/components/TournamentBracket';
import { notFound } from 'next/navigation';

export default async function TorneoPage({ params }: { params: { id: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: { categories: true }
  });

  if (!tournament) {
    notFound();
  }

  // Ejemplo: Obtenemos los partidos de la primera categoría para demostración
  const categoryId = tournament.categories[0]?.id;
  const matches = categoryId 
    ? await prisma.match.findMany({ where: { categoryId } }) 
    : [];

  return (
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          <p className="text-slate-500 mt-2">Sigue los resultados en vivo y las llaves del torneo.</p>
        </div>

        {matches.length === 0 ? (
          <p className="text-slate-500">Aún no se han generado las llaves para este torneo.</p>
        ) : (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <TournamentBracket matches={matches} />
          </div>
        )}
      </div>
    </div>
  );
}
