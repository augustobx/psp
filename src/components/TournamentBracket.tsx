'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type Match = {
  id: string;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
};

export default function TournamentBracket({ matches }: { matches: Match[] }) {
  // Simples llaves visuales: agrupamos por ronda
  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

  return (
    <div className="flex gap-8 overflow-x-auto p-4 w-full h-full min-h-[400px] bg-slate-50 dark:bg-slate-900 rounded-xl">
      {rounds.map(round => (
        <div key={round} className="flex flex-col justify-around min-w-[200px]">
          <h3 className="text-center font-semibold mb-4 text-slate-700 dark:text-slate-300">Ronda {round}</h3>
          <div className="flex flex-col gap-6">
            {matches.filter(m => m.round === round).map(match => (
              <Card key={match.id} className="relative border-slate-200 dark:border-slate-800">
                <CardContent className="p-3 flex flex-col gap-2">
                  <div className={`flex justify-between p-2 rounded ${match.winnerId === match.player1Id ? 'bg-green-100 dark:bg-green-900/30 font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <span className="truncate">{match.player1Id || 'Bye'}</span>
                    <span>{match.score1 ?? '-'}</span>
                  </div>
                  <div className={`flex justify-between p-2 rounded ${match.winnerId === match.player2Id ? 'bg-green-100 dark:bg-green-900/30 font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <span className="truncate">{match.player2Id || 'TBD'}</span>
                    <span>{match.score2 ?? '-'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
