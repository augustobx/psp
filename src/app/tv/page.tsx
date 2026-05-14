'use client';

import { useEffect, useState } from 'react';
import { getPublicTournaments, getTournamentDetails } from '@/actions/public-tournaments';
import { Trophy } from 'lucide-react';

// TV Mode Component (Pantalla completa, rotación automática)
export default function TvModePage() {
  const [tournament, setTournament] = useState<any>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Intervalos de rotación (15s por slide)
  useEffect(() => {
    const fetchTorneo = async () => {
      const pubReq = await getPublicTournaments();
      const active = pubReq.data?.find(t => t.status === 'ONGOING' || t.status === 'REGISTRATION');
      
      if (active) {
        const detailReq = await getTournamentDetails(active.id);
        if (detailReq.success) {
          setTournament(detailReq.data);
        }
      }
      setLoading(false);
    };

    fetchTorneo();
    // Refrescar data cada minuto
    const dataInterval = setInterval(fetchTorneo, 60000);
    return () => clearInterval(dataInterval);
  }, []);

  useEffect(() => {
    if (!tournament) return;
    
    // Rotar slides cada 10 segundos
    const slideInterval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % 3); // 3 slides
    }, 10000);
    
    return () => clearInterval(slideInterval);
  }, [tournament]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Trophy className="w-16 h-16 animate-pulse" /></div>;

  if (!tournament) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-10">
        <Trophy className="w-32 h-32 text-slate-800 mb-8" />
        <h1 className="text-5xl font-bold text-slate-700">No hay torneos activos en este momento</h1>
      </div>
    );
  }

  // Extraer todos los partidos y grupos de todas las categorías
  const allMatches = tournament.categories.flatMap((c: any) => c.matches.map((m: any) => ({...m, categoryName: c.name})));
  const liveMatches = allMatches.filter((m: any) => m.status === 'IN_PROGRESS');
  const nextMatches = allMatches.filter((m: any) => m.status === 'SCHEDULED').slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
      
      {/* HEADER DE LA TV */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <h1 className="text-5xl font-black tracking-tight">{tournament.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-bold text-2xl tracking-widest animate-pulse">EN VIVO</p>
        </div>
      </div>

      {/* CONTENIDO DEL CARRUSEL */}
      <div className="flex-1 p-8 flex flex-col relative">
        {slideIndex === 0 && (
          <div className="animate-in fade-in zoom-in duration-1000 h-full">
            <h2 className="text-4xl font-bold text-blue-400 mb-8 uppercase tracking-widest text-center">Partidos en Curso</h2>
            {liveMatches.length === 0 ? (
              <div className="flex items-center justify-center h-[60%] text-slate-600 text-3xl font-bold">No hay partidos en curso</div>
            ) : (
              <div className="grid grid-cols-2 gap-8">
                {liveMatches.map((m: any) => (
                  <div key={m.id} className="bg-slate-900 border-l-4 border-red-500 rounded-3xl p-8 flex flex-col justify-center">
                    <p className="text-slate-400 font-bold text-xl mb-6">{m.categoryName} - {m.roundName || `Ronda ${m.round}`}</p>
                    <div className="flex justify-between items-center text-4xl font-black mb-4">
                      <span>{m.team1?.name || 'TBD'}</span>
                      <span className="text-yellow-400">{m.scoreTeam1 ?? '0'}</span>
                    </div>
                    <div className="flex justify-between items-center text-4xl font-black">
                      <span>{m.team2?.name || 'TBD'}</span>
                      <span className="text-yellow-400">{m.scoreTeam2 ?? '0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {slideIndex === 1 && (
          <div className="animate-in fade-in zoom-in duration-1000 h-full">
            <h2 className="text-4xl font-bold text-purple-400 mb-8 uppercase tracking-widest text-center">Próximos Cruces</h2>
            <div className="space-y-4">
              {nextMatches.map((m: any, i: number) => (
                <div key={i} className="bg-slate-900/80 rounded-2xl p-6 flex justify-between items-center border border-slate-800">
                  <div className="text-2xl font-bold w-1/3 truncate">{m.team1?.name || 'TBD'}</div>
                  <div className="text-slate-500 font-black text-3xl">VS</div>
                  <div className="text-2xl font-bold w-1/3 text-right truncate">{m.team2?.name || 'TBD'}</div>
                  <div className="w-1/4 text-right">
                    <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-xl font-bold">{m.categoryName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {slideIndex === 2 && (
          <div className="animate-in fade-in zoom-in duration-1000 h-full">
            <h2 className="text-4xl font-bold text-emerald-400 mb-8 uppercase tracking-widest text-center">Tablas de Posiciones</h2>
            {/* Mostrar grupos si es Round Robin */}
            <div className="grid grid-cols-2 gap-8">
              {tournament.categories.map((c: any) => 
                c.groups.slice(0, 2).map((g: any) => (
                  <div key={g.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                    <h3 className="text-2xl font-bold text-yellow-500 mb-4">{c.name} - {g.name}</h3>
                    <table className="w-full text-xl">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="text-left pb-4">Pareja</th>
                          <th className="pb-4">Pts</th>
                          <th className="pb-4">PJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.teams.map((gt: any) => (
                          <tr key={gt.id} className="border-b border-slate-800/50">
                            <td className="py-4 font-medium">{gt.team.name}</td>
                            <td className="py-4 text-center font-black text-emerald-400">{gt.points}</td>
                            <td className="py-4 text-center text-slate-400">{gt.matchesPlayed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER / SPONSORS */}
      <div className="bg-slate-900 p-4 border-t border-slate-800 flex items-center justify-between">
        <p className="text-slate-500 font-medium">PSP Padel System - www.psp.com</p>
        <div className="flex gap-4 items-center">
          <span className="text-slate-600 font-bold uppercase text-sm">Sponsor Space</span>
          <div className="h-10 w-32 bg-slate-800 rounded"></div>
          <div className="h-10 w-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>
  );
}
