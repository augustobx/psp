import { getPublicCourts } from "@/actions/public-bookings";
import { getSettings } from "@/actions/settings";
import BookingFlow from "@/components/BookingFlow";
import PublicNavbar from "@/components/PublicNavbar";

export default async function HomePage() {
    const courtsRes = await getPublicCourts();
    const courts = courtsRes?.success && courtsRes?.data ? courtsRes.data : [];

    const settings = await getSettings();
    const theme = settings?.theme || 'light';

    const isReservationsEnabled = settings?.reservationsEnabled ?? true;
    const isWhatsappReservations = settings?.whatsappReservations ?? true;

    if (!isReservationsEnabled) {
        const phone = settings?.contactPhone?.replace(/\D/g, '') || "";
        const waLink = `https://wa.me/${phone}?text=Hola,%20quiero%20reservar%20un%20turno.`;

        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-100'}`}>
                <div className={`max-w-md w-full rounded-3xl shadow-xl p-8 text-center border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <h1 className="text-2xl font-black mb-2">Reservas Pausadas</h1>
                    <p className={`mb-8 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        El sistema automático de turnos se encuentra desactivado momentáneamente.
                    </p>

                    {isWhatsappReservations && phone && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full">
                            <button className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                Reservar por WhatsApp
                            </button>
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // CONTENEDOR VISUAL ARREGLADO (Centrado en PC, ancho completo en Mobile)
    return (
        <div className={`${theme} min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:items-center md:py-8`}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen md:min-h-0 md:rounded-[2.5rem] md:shadow-2xl md:border md:border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col">
                <PublicNavbar sysSettings={settings} />
                <BookingFlow courts={courts} sysSettings={settings} />
            </div>
        </div>
    );
}