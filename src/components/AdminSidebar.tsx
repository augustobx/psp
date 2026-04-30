
'use client';

import Link from 'next/link';
-import { usePathname } from 'next/navigation';
+import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Trophy,
  DollarSign,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Canchas', href: '/admin/courts', icon: Map },
  { name: 'Calendario', href: '/admin/calendar', icon: CalendarDays },
  { name: 'Torneos', href: '/admin/tournaments', icon: Trophy },
  { name: 'Gastos', href: '/admin/expenses', icon: DollarSign },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  +  const router = useRouter();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">PSP Admin</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/50'
                )}
              >
                <Icon className={cn('mr-3 h-5 w-5', isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-1">
        <Link
          href="/admin/settings"
          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/50"
        >
          <Settings className="mr-3 h-5 w-5 text-slate-400" />
          Configuración
        </Link>
        <button
+          type="button"
        +          onClick={() => router.push('/')}
        className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
         >
        <LogOut className="mr-3 h-5 w-5 text-slate-400" />
        Cerrar Sesión
      </button>
    </div>
     </div >
   );
}
