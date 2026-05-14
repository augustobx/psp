import { getTournamentDetails } from "@/actions/public-tournaments";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, MapPin, Trophy } from "lucide-react";
import TournamentBracket from "@/components/TournamentBracket";

export default async function PublicTournamentDetail(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const response = await getTournamentDetails(params.id);
  const tournament = response.success && response.data ? response.data : null;

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Torneo no encontrado o no disponible</h1>
        <Link href="/torneos" className="mt-4 text-blue-600 hover:underline">Volver a Torneos</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <Link href="/torneos" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Volver
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">{tournament.format}</Badge>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">{tournament.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Inicio: {new Date(tournament.startDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-1"><Users className="w-4 h-4" /> Inscripción: ${tournament.entryFee.toString()}</div>
              </div>
            </div>
            
            {tournament.status === 'REGISTRATION' && (
              <Link href={`/torneos/${tournament.id}/registro`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/30 text-center w-full md:w-auto active:scale-95">
                Inscribir Pareja
              </Link>
            )}
            {tournament.status === 'ONGOING' && (
              <div className="bg-red-500/10 text-red-500 font-bold py-3 px-6 rounded-2xl border border-red-500/20 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                TORNEO EN JUEGO
              </div>
            )}
          </div>
        </div>

        {/* CATEGORIAS Y LLAVES */}
        <div className="space-y-12">
          {tournament.categories.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No hay categorías configuradas aún.</div>
          ) : (
            tournament.categories.map((category) => (
              <div key={category.id} className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Trophy className="w-6 h-6 text-yellow-500" /> Categoría: {category.name}
                </h2>

                {category.groups.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.groups.map(g => (
                      <div key={g.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-lg mb-4 text-center">{g.name}</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-100 dark:border-slate-800">
                              <th className="text-left pb-2">Pareja</th>
                              <th className="pb-2">Pts</th>
                              <th className="pb-2">PJ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.teams.map(gt => (
                              <tr key={gt.id} className="border-b border-slate-50 dark:border-slate-800/50">
                                <td className="py-3 font-medium">{gt.team.name}</td>
                                <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{gt.points}</td>
                                <td className="py-3 text-center">{gt.matchesPlayed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {category.matches.length > 0 ? (
                  <div className="overflow-x-auto pb-6">
                    <TournamentBracket matches={category.matches} format={category.format || tournament.format} />
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
                    Las llaves se publicarán próximamente.
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}