import { getPublicTournaments } from "@/actions/public-tournaments";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Trophy, Calendar } from "lucide-react";

export default async function TorneosPublicPage() {
  const response = await getPublicTournaments();
  const tournaments = response.success && response.data ? response.data : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">Torneos</h1>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">No hay torneos disponibles</h2>
            <p className="text-slate-500 mt-2">Próximamente estaremos anunciando nuevas competencias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournaments.map(t => (
              <Link key={t.id} href={`/torneos/${t.id}`} className="group">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden relative">
                  {t.status === 'ONGOING' && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl animate-pulse">
                      EN JUEGO
                    </div>
                  )}
                  {t.status === 'REGISTRATION' && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                      INSCRIPCIONES ABIERTAS
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{t.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(t.startDate), "d MMM", { locale: es })} - {format(new Date(t.endDate), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm text-slate-500">Inscripción</p>
                      <p className="font-bold text-lg text-slate-900 dark:text-white">${t.entryFee.toString()}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Ver Detalles
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
