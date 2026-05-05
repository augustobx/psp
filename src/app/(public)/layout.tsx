import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import { prisma } from '@/lib/prisma';
import { Lock } from 'lucide-react';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  const isEnabled = settings?.pwaEnabled ?? true;

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Sitio en Mantenimiento</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Nuestra plataforma web se encuentra temporalmente desactivada. Por favor intentá nuevamente más tarde o contactanos por WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
