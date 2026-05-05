'use client';

import Link from 'next/link';

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
        </div>
      </div>
    </nav>
  );
}