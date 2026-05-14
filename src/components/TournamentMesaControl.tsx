'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { updateMatchScore, setMatchInProgress } from '@/actions/tournament-engine';
import { useRouter } from 'next/navigation';
import { Play, CheckCircle2, Clock } from 'lucide-react';

export default function TournamentMesaControl({ tournament }: { tournament: any }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const matches = (tournament.categories || []).flatMap((c: any) =>
    (c.matches || []).map((m: any) => ({ ...m, categoryName: c.name }))
  );

  const pendingMatches = matches.filter((m: any) => m.status !== 'COMPLETED' && m.team1Id && m.team2Id);
  const completedMatches = matches.filter((m: any) => m.status === 'COMPLETED' && m.scoreTeam1 !== 'BYE' && m.scoreTeam2 !== 'BYE');

  const handleStartMatch = async (matchId: string) => {
    setLoading(matchId);
    await setMatchInProgress(matchId);
    setLoading(null);
    router.refresh();
  };

  const handleUpdate = async (matchId: string) => {
    const s1 = (document.getElementById(`s1-${matchId}`) as HTMLInputElement)?.value || '';
    const s2 = (document.getElementById(`s2-${matchId}`) as HTMLInputElement)?.value || '';
    const wId = (document.getElementById(`w-${matchId}`) as HTMLSelectElement)?.value || '';

    if (!wId) {
      alert("Seleccioná un ganador");
      return;
    }

    setLoading(matchId);
    await updateMatchScore(matchId, s1, s2, wId);
    setLoading(null);
    router.refresh();
  };

  if (matches.length === 0) {
    return <p className="text-slate-500 py-4 text-center">Generá un cuadro desde la sección de Categorías para empezar.</p>;
  }

  return (
    <div className="space-y-8">
      {/* PARTIDOS ACTIVOS */}
      {pendingMatches.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> Partidos Pendientes / En Juego ({pendingMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingMatches.map((m: any) => (
              <Card key={m.id} className={`border-l-4 ${m.status === 'IN_PROGRESS' ? 'border-l-red-500' : 'border-l-blue-300'}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">{m.categoryName}</span>
                    <Badge variant={m.status === 'IN_PROGRESS' ? 'destructive' : 'secondary'} className="text-xs">
                      {m.status === 'IN_PROGRESS' ? '🔴 EN VIVO' : m.roundName || `Ronda ${m.round}`}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate font-medium text-sm">{m.team1?.name || 'TBD'}</span>
                      <Input id={`s1-${m.id}`} type="text" placeholder="6-4 / 7-5" defaultValue={m.scoreTeam1 || ''} className="w-28 text-center h-8 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate font-medium text-sm">{m.team2?.name || 'TBD'}</span>
                      <Input id={`s2-${m.id}`} type="text" placeholder="4-6 / 5-7" defaultValue={m.scoreTeam2 || ''} className="w-28 text-center h-8 text-sm" />
                    </div>
                  </div>

                  <select id={`w-${m.id}`} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm" defaultValue="">
                    <option value="">Seleccionar Ganador...</option>
                    {m.team1Id && <option value={m.team1Id}>{m.team1?.name}</option>}
                    {m.team2Id && <option value={m.team2Id}>{m.team2?.name}</option>}
                  </select>

                  <div className="flex gap-2">
                    {m.status === 'SCHEDULED' && (
                      <Button variant="outline" size="sm" onClick={() => handleStartMatch(m.id)} disabled={loading === m.id} className="flex-1">
                        <Play className="w-3 h-3 mr-1" /> Iniciar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleUpdate(m.id)}
                      disabled={loading === m.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {loading === m.id ? 'Guardando...' : 'Finalizar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingMatches.length === 0 && (
        <p className="text-slate-500 py-4 text-center">No hay partidos pendientes. Todos los cruces fueron definidos.</p>
      )}

      {/* RESULTADOS CARGADOS */}
      {completedMatches.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Resultados Cargados ({completedMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {completedMatches.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border text-sm">
                <div className="flex-1">
                  <span className={`${m.winnerId === m.team1Id ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>{m.team1?.name}</span>
                  <span className="mx-2 text-slate-400">vs</span>
                  <span className={`${m.winnerId === m.team2Id ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>{m.team2?.name}</span>
                </div>
                <span className="font-mono font-bold text-xs">{m.scoreTeam1} / {m.scoreTeam2}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
