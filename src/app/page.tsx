import { getPublicCourts } from "@/actions/public-bookings";
import { getSettings } from "@/actions/settings";
import BookingFlow from "@/components/BookingFlow";
import PublicNavbar from "@/components/PublicNavbar";

export default async function Home() {
    const [courtsRes, settingsRes] = await Promise.all([getPublicCourts(), getSettings()]);

    const courts = courtsRes.success && courtsRes.data ? courtsRes.data : [];
    const settings = settingsRes.success && settingsRes.data ? settingsRes.data : null;

    // Acá tomamos la decisión: si el admin eligió dark, disparamos la clase 'dark' de Tailwind
    const theme = settings?.theme || 'light';
    const isDark = theme === 'dark';

    return (
        // ESTE ES EL CONTENEDOR MAESTRO. La clase 'dark' activa todos los colores oscuros de adentro.
        <div className={isDark ? 'dark' : ''}>

            {/* Fondo base que reacciona al modo oscuro con alto contraste */}
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-500 flex flex-col items-center">

                <div className="w-full z-50">
                    <PublicNavbar />
                </div>

                <div className="w-full max-w-md h-full flex-1 sm:py-6">
                    <BookingFlow courts={courts} sysSettings={settings} />
                </div>

            </main>
        </div>
    );
}