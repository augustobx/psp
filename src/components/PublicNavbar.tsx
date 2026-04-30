import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-black text-blue-600 dark:text-blue-400">
            PSP
          </Link>
          <div className="hidden md:ml-10 md:flex md:space-x-8">
            <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
              Inicio
            </Link>
            <Link href="/reservas" className="text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
              Reservar
            </Link>
            <Link href="/torneos" className="text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
              Torneos
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/admin/dashboard" className={buttonVariants({ variant: "outline", className: "hidden sm:inline-flex" })}>
            Admin
          </Link>
          <Link href="/reservas" className={buttonVariants()}>
            Reservar Ya
          </Link>
        </div>
      </div>
    </nav>
  );
}
