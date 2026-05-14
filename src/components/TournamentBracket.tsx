'use client';

import React from 'react';

export default function TournamentBracket({ matches, format }: { matches: any[], format?: string }) {
  if (format === 'ROUND_ROBIN') {
    return <div className="text-center p-4 text-slate-500">Este torneo se juega por puntos (ver tablas de grupos arriba).</div>;
  }

  const rounds = Array.from(new Set(matches.filter(m => !m.groupId).map(m => m.round))).sort((a, b) => b - a);
  // Asumimos que round mayor es la final (ej: round 1 es final, round 2 semis, o al reves)
  // Normalmente la final es la última ronda. Prisma los trae ordenados.

  return (
    <div className="flex gap-8 p-4 min-h-[400px]">
      {rounds.map(round => {
        const roundMatches = matches.filter(m => m.round === round && !m.groupId);
        let roundName = roundMatches[0]?.roundName || `Ronda ${round}`;
        
        return (
          <div key={round} className="flex flex-col justify-around min-w-[250px] relative">
            <h3 className="text-center font-bold mb-6 text-slate-800 dark:text-slate-200">{roundName}</h3>
            <div className="flex flex-col gap-8 justify-center h-full">
              {roundMatches.map((match, i) => (
                <div key={match.id} className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  {/* Status Indicator */}
                  {match.status === 'IN_PROGRESS' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                  
                  <div className="flex flex-col">
                    <div className={`flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 ${match.winnerId === match.team1Id ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                      <span className={`font-medium truncate pr-2 ${match.winnerId === match.team1Id ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {match.team1?.name || 'TBD'}
                      </span>
                      <span className="font-bold tabular-nums">{match.scoreTeam1 ?? '-'}</span>
                    </div>
                    <div className={`flex justify-between items-center p-3 ${match.winnerId === match.team2Id ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                      <span className={`font-medium truncate pr-2 ${match.winnerId === match.team2Id ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {match.team2?.name || 'TBD'}
                      </span>
                      <span className="font-bold tabular-nums">{match.scoreTeam2 ?? '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
