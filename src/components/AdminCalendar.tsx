'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Lock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAdminDayBookings, createAdminBooking, cancelAdminBooking } from '@/actions/admin-calendar';

export default function AdminCalendar({ courts }: { courts: any[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCourtFilter, setSelectedCourtFilter] = useState('ALL');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'CREATE' | 'VIEW'>('CREATE');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [dbError, setDbError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        courtId: '',
        startTime: '',
        endTime: '',
        type: 'RESERVA',
        clientName: ''
    });

    const loadData = async (date: Date) => {
        setLoading(true);
        const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const res = await getAdminDayBookings(dateStr);
        if (res.success && res.data) setBookings(res.data);
        setLoading(false);
    };

    useEffect(() => {
        loadData(currentDate);
    }, [currentDate]);

    const changeDay = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const visibleCourts = selectedCourtFilter === 'ALL'
        ? courts
        : courts.filter(c => c.id === selectedCourtFilter);

    // Generamos intervalos de 30 minutos desde 08:00 hasta 23:30
    const timeSlots: string[] = [];
    for (let h = 8; h <= 23; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const handleEmptyClick = (courtId: string, timeStr: string) => {
        // Calculamos 90 minutos por defecto para Padel
        const [h, m] = timeStr.split(':').map(Number);
        const totalMins = h * 60 + m + 90;
        const endH = Math.floor(totalMins / 60).toString().padStart(2, '0');
        const endM = (totalMins % 60).toString().padStart(2, '0');

        setFormData({
            courtId,
            startTime: timeStr,
            endTime: `${endH}:${endM}`,
            type: 'RESERVA',
            clientName: ''
        });
        setDbError(null);
        setModalMode('CREATE');
        setModalOpen(true);
    };

    const submitCreate = async () => {
        setDbError(null);
        const dateStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const res = await createAdminBooking({ ...formData, dateStr } as any);

        if (res.success) {
            setModalOpen(false);
            loadData(currentDate);
        } else {
            setDbError(res.error || 'Error desconocido');
        }
    };

    const handleCancelBooking = async () => {
        if (confirm('¿Estás seguro de cancelar/borrar este turno?')) {
            await cancelAdminBooking(selectedBooking.id);
            setModalOpen(false);
            loadData(currentDate);
        }
    };

    const getBackgroundColor = (status: string) => {
        if (status === 'BLOCKED') return 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800';
        if (status === 'FIXED') return 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800';
        if (status === 'PENDING') return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800';
        return 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'; // CONFIRMED
    };

    const getIcon = (status: string) => {
        if (status === 'BLOCKED') return <Lock className="w-4 h-4 text-red-500 mr-2" />;
        if (status === 'FIXED') return <CalendarCheck className="w-4 h-4 text-purple-500 mr-2" />;
        return <CalendarCheck className="w-4 h-4 text-emerald-500 mr-2" />;
    };

    return (
        <div className="space-y-6">
            {/* Controles de Navegación Estilo Premium */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="rounded-full w-10 h-10 p-0" onClick={() => changeDay(-1)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="font-bold text-xl min-w-[220px] text-center text-slate-800 dark:text-slate-100">
                        {currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                    </div>
                    <Button variant="outline" className="rounded-full w-10 h-10 p-0" onClick={() => changeDay(1)}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button variant="secondary" className="ml-2 rounded-xl" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center"><span className="w-3 h-3 bg-emerald-400 rounded-full mr-2"></span> Reserva</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span> Bloqueo</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span> Fijo</div>
                    </div>
                    <select
                        value={selectedCourtFilter}
                        onChange={(e) => setSelectedCourtFilter(e.target.value)}
                        className="border-slate-200 rounded-xl shadow-sm p-2.5 text-sm font-medium bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none"
                    >
                        <option value="ALL">Todas las Canchas</option>
                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Grilla Matricial Profesional */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="w-24 border-b border-r bg-slate-50 dark:bg-slate-800/50 p-4 text-slate-500 font-semibold text-sm">
                                    Horario
                                </th>
                                {visibleCourts.map(court => (
                                    <th key={court.id} className="border-b bg-slate-50 dark:bg-slate-800/50 p-4 text-slate-800 dark:text-slate-100 font-bold text-center">
                                        {court.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map((time, index) => {
                                const isHour = time.endsWith(':00');
                                const dateStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                                const slotDateTime = new Date(`${dateStr}T${time}:00`);

                                return (
                                    <tr key={time} className={isHour ? 'border-t border-slate-100 dark:border-slate-800/50' : ''}>
                                        <td className="border-r border-slate-100 dark:border-slate-800/50 p-2 text-center text-xs font-medium text-slate-400 bg-slate-50/30 dark:bg-slate-900">
                                            {isHour ? time : ''}
                                        </td>

                                        {visibleCourts.map(court => {
                                            // Verificar si hay un turno que EMPIEZA en este bloque
                                            const startingBooking = bookings.find(b => b.courtId === court.id && new Date(b.startTime).getTime() === slotDateTime.getTime());

                                            if (startingBooking) {
                                                const durationMins = (new Date(startingBooking.endTime).getTime() - new Date(startingBooking.startTime).getTime()) / 60000;
                                                const rowSpan = Math.max(1, Math.ceil(durationMins / 30));

                                                return (
                                                    <td key={court.id} rowSpan={rowSpan} className="border border-slate-100 dark:border-slate-800 p-1.5 align-top">
                                                        <div
                                                            onClick={() => { setSelectedBooking(startingBooking); setModalMode('VIEW'); setModalOpen(true); }}
                                                            className={`h-full w-full rounded-xl p-3 border cursor-pointer transition-all ${getBackgroundColor(startingBooking.status)}`}
                                                        >
                                                            <div className="flex items-center font-bold text-sm mb-1">
                                                                {getIcon(startingBooking.status)}
                                                                {new Date(startingBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(startingBooking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="text-sm font-medium opacity-90 ml-6">
                                                                {startingBooking.user?.name || startingBooking.description || 'Turno Registrado'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Verificar si este bloque está OCUPADO por un turno anterior (para no dibujar la celda)
                                            const isOverlapped = bookings.some(b => {
                                                if (b.courtId !== court.id) return false;
                                                const start = new Date(b.startTime).getTime();
                                                const end = new Date(b.endTime).getTime();
                                                const current = slotDateTime.getTime();
                                                return current > start && current < end;
                                            });

                                            if (isOverlapped) return null; // La celda anterior con rowSpan ya ocupa este espacio

                                            // Renderizar bloque LIBRE interactivo
                                            return (
                                                <td
                                                    key={court.id}
                                                    className="border border-slate-50 dark:border-slate-800/30 p-1 group cursor-pointer"
                                                    onClick={() => handleEmptyClick(court.id, time)}
                                                >
                                                    <div className="h-[30px] w-full rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all text-blue-600 font-medium text-xs">
                                                        <Plus className="w-3 h-3 mr-1" /> Reservar {time}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE RESERVA / VISUALIZACIÓN */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-2xl">
                    {modalMode === 'CREATE' ? (
                        <>
                            <DialogHeader><DialogTitle className="text-xl font-bold">Agendar Turno</DialogTitle></DialogHeader>

                            {/* ALERTA DE ERROR DE BASE DE DATOS */}
                            {dbError && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md text-sm font-mono overflow-x-auto">
                                    <strong>Error de Base de Datos:</strong><br />{dbError}
                                </div>
                            )}

                            <div className="space-y-5 mt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600">Hora Inicio</Label>
                                        <Input type="time" className="rounded-xl" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600">Hora Fin</Label>
                                        <Input type="time" className="rounded-xl" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-600">Tipo de Acción</Label>
                                    <select
                                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                        value={formData.type}
                                        onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="RESERVA">🎾 Reserva de Cliente (Local)</option>
                                        <option value="FIJO">📅 Abono Fijo (Recurrente)</option>
                                        <option value="BLOQUEO">🔒 Bloqueo (Mantenimiento / Lluvia)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-600">{formData.type === 'BLOQUEO' ? 'Motivo del bloqueo' : 'Nombre del Cliente'}</Label>
                                    <Input
                                        className="rounded-xl"
                                        placeholder={formData.type === 'BLOQUEO' ? 'Ej: Lluvia / Reparación' : 'Ej: Juan Pérez'}
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                                    <Button variant="ghost" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancelar</Button>
                                    <Button onClick={submitCreate} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">Guardar Turno</Button>
                                </div>
                            </div>
                        </>
                    ) : selectedBooking && (
                        <>
                            <DialogHeader><DialogTitle className="text-xl font-bold">Detalle del Turno</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-xl space-y-3">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-sm font-medium text-slate-500">Cancha</span>
                                        <span className="font-bold">{selectedBooking.court.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-sm font-medium text-slate-500">Horario</span>
                                        <span className="font-bold text-blue-600">
                                            {new Date(selectedBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} a {new Date(selectedBooking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-sm font-medium text-slate-500">Titular</span>
                                        <span className="font-bold">{selectedBooking.user?.name || selectedBooking.description || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-500">Estado</span>
                                        <span className="font-bold uppercase text-xs px-2 py-1 bg-slate-200 rounded-md">{selectedBooking.status}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="destructive" className="rounded-xl bg-red-500 hover:bg-red-600" onClick={handleCancelBooking}>Borrar / Cancelar</Button>
                                    <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cerrar</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}