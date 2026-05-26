'use client';

import Link from 'next/link';
import { CalendarSearch, Trophy } from 'lucide-react';

export default function PublicNavbar({ sysSettings }: { sysSettings?: any }) {
  const topbarTitle = sysSettings?.topbarName || "PSP Padel";

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:rounded-t-[2.5rem] relative z-20">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">{sysSettings?.sportEmoji || "🎾"}</span>
              <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                {topbarTitle}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {sysSettings?.tournamentsEnabled && (
              <Link
                href="/torneos"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 rounded-full transition-colors"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Torneos</span>
              </Link>
            )}
            <Link
              href="/mis-turnos"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <CalendarSearch className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Turnos</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}