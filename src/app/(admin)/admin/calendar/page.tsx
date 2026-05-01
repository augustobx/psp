import { getCourts } from "@/actions/courts";
import AdminCalendar from "@/components/AdminCalendar";

export default async function CalendarPage() {
    const response = await getCourts();

    // Filtramos para mandarle al calendario solo las canchas que están operativas
    const activeCourts = response.success && response.data
        ? response.data.filter(court => court.isActive)
        : [];

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Calendario Operativo</h1>
            </div>

            {activeCourts.length > 0 ? (
                <AdminCalendar courts={activeCourts} />
            ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                    <p className="text-slate-500">No hay canchas activas configuradas en el sistema.</p>
                </div>
            )}
        </div>
    );
}