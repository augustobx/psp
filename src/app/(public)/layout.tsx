import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
