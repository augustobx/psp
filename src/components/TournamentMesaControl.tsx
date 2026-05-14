'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateMatchScore } from '@/actions/tournament-engine';

export default function TournamentMesaControl({ tournament }: { tournament: any }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async (matchId: string, team1Id: string | null, team2Id: string | null) => {
    const s1 = (document.getElementById(`s1-${matchId}`) as HTMLInputElement).value;
    const s2 = (document.getElementById(`s2-${matchId}`) as HTMLInputElement).value;
    const wId = (document.getElementById(`w-${matchId}`) as HTMLSelectElement).value;

    if (!wId) {
      alert("Por favor selecciona un ganador");
      return;
    }

    setLoading(matchId);
    await updateMatchScore(matchId, s1, s2, wId);
    setLoading(null);
  };

  const matches = tournament.categories.flatMap((c: any) => c.matches.map((m: any) => ({ ...m, categoryName: c.name })));
  const activeMatches = matches.filter((m: any) => m.status !== 'COMPLETED' && m.team1Id && m.team2Id);

  return (
    <div className="space-y-4">
      {activeMatches.length === 0 ? (
        <p className="text-slate-500 py-4 text-center">No hay partidos pendientes listos para jugar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMatches.map((m: any) => (
            <Card key={m.id} className="border-blue-100 dark:border-blue-900/50">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-bold text-blue-600 dark:text-blue-400">
                  <span>{m.categoryName}</span>
                  <span>{m.roundName || `Ronda ${m.round}`}</span>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="truncate text-right font-medium">{m.team1?.name}</span>
                  <Input id={`s1-${m.id}`} type="text" placeholder="Set 1" defaultValue={m.scoreTeam1 || ''} className="text-center h-8" />
                  <span className="text-slate-400 text-xs">Score T1</span>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="truncate text-right font-medium">{m.team2?.name}</span>
                  <Input id={`s2-${m.id}`} type="text" placeholder="Set 2" defaultValue={m.scoreTeam2 || ''} className="text-center h-8" />
                  <span className="text-slate-400 text-xs">Score T2</span>
                </div>

                <div className="mt-2 space-y-2 border-t pt-3">
                  <select id={`w-${m.id}`} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm" defaultValue={m.winnerId || ''}>
                    <option value="">Seleccionar Ganador...</option>
                    <option value={m.team1Id}>{m.team1?.name}</option>
                    <option value={m.team2Id}>{m.team2?.name}</option>
                  </select>
                  
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    size="sm"
                    disabled={loading === m.id}
                    onClick={() => handleUpdate(m.id, m.team1Id, m.team2Id)}
                  >
                    {loading === m.id ? 'Guardando...' : 'Guardar Resultado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
