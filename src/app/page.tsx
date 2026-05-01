import { getPublicCourts } from "@/actions/public-bookings";
import BookingFlow from "@/components/BookingFlow";
import PublicNavbar from "@/components/PublicNavbar"; // <-- Acá lo traemos de vuelta

export default async function Home() {
    const response = await getPublicCourts();
    const courts = response.success && response.data ? response.data : [];

    return (
        // Pantalla completa, fondo neutro
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center">

            {/* El Navbar a pantalla completa pero con el contenido centrado */}
            <div className="w-full z-50">
                <PublicNavbar />
            </div>

            {/* El contenedor de la App PWA */}
            <div className="w-full max-w-md h-full flex-1 sm:py-6">
                <BookingFlow courts={courts} />
            </div>

        </main>
    );
}