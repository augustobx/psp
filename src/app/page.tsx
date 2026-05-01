import { getPublicCourts } from "@/actions/public-bookings";
import BookingFlow from "@/components/BookingFlow";

export default async function Home() {
    const response = await getPublicCourts();
    const courts = response.success && response.data ? response.data : [];

    return (
        // Pantalla completa, sin márgenes extras, color de fondo neutro
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
            <div className="w-full max-w-md h-full min-h-screen sm:min-h-0 sm:mt-8">
                <BookingFlow courts={courts} />
            </div>
        </main>
    );
}