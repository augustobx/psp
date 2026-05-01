import Link from "next/link";

export default function PublicNavbar() {
  return (
    // dark:bg-slate-950/80 garantiza un fondo súper oscuro y elegante para el modo Dark
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center font-black text-slate-900 text-xs shadow-sm">
            PSP
          </div>
          <span className="font-bold tracking-tight text-xl text-slate-800 dark:text-slate-100">
            Padel Club
          </span>
        </Link>
      </div>
    </header>
  );
}