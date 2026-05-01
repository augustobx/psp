import { getCourts } from "@/actions/courts";
import CalendarGrid from "./CalendarGrid";

export default async function CalendarPage() {
    // Obtenemos las canchas para pasárselas a la grilla
    const response = await getCourts();
    const activeCourts = response.success && response.data
        ? response.data.filter(court => court.isActive)
        : [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Calendario</h1>
            </div>

            {activeCourts.length > 0 ? (
                <CalendarGrid activeCourts={activeCourts} />
            ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                    <p className="text-slate-500">No hay canchas activas configuradas en el sistema.</p>
                    <p className="text-sm text-slate-400 mt-2">Agregá o activá canchas desde la sección de Gestión de Canchas.</p>
                </div>
            )}
        </div>
    );
}