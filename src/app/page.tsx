import { getPublicCourts } from "@/actions/public-bookings";
import { getSettings } from "@/actions/settings";
import BookingFlow from "@/components/BookingFlow";
import PublicNavbar from "@/components/PublicNavbar";

export default async function HomePage() {
    const courtsRes = await getPublicCourts();
    const courts = courtsRes?.success && courtsRes?.data ? courtsRes.data : [];

    const settings = await getSettings();
    const theme = settings?.theme || 'light';

    // Leemos los booleanos desde la base de datos
    const isReservationsEnabled = settings?.reservationsEnabled ?? true;
    const isWhatsappReservations = settings?.whatsappReservations ?? true;

    // 1. PANTALLA DE RESERVAS PAUSADAS (Ahora sí bloquea el inicio)
    if (!isReservationsEnabled) {
        const phone = settings?.contactPhone?.replace(/\D/g, '') || "";
        const waLink = `https://wa.me/${phone}?text=Hola,%20quiero%20reservar%20un%20turno.`;

        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold mb-2">Reservas Pausadas</h1>
                    <p className={`mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        El sistema automático de turnos se encuentra desactivado momentáneamente.
                    </p>

                    {/* Botón condicional de WhatsApp */}
                    {isWhatsappReservations && phone && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full">
                            <button className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                Reservar por WhatsApp
                            </button>
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // 2. SISTEMA ACTIVO: Pasamos TODO el objeto settings a los componentes
    return (
        <div className={theme}>
            <PublicNavbar />
            <BookingFlow courts={courts} sysSettings={settings} />
        </div>
    );
}