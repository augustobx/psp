import { getPublicCourts } from "@/actions/public-bookings";
import BookingFlow from "@/components/BookingFlow";

export default async function Home() {
    const response = await getPublicCourts();
    const courts = response.success && response.data ? response.data : [];

    return (
        // Fondo neutro, centrado en escritorio, pantalla completa en celu
        <main className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
            <div className="flex-1 w-full max-w-md mx-auto md:py-8 h-full">
                <BookingFlow courts={courts} />
            </div>
        </main>
    );
}