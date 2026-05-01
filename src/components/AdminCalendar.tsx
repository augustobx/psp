'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Lock, CalendarCheck, User, Clock } from 'lucide-react';
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
        const [h, m] = timeStr.split(':').map(Number);
        const totalMins = h * 60 + m + 90; // 90 mins por defecto para Padel
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

        const payload = {
            courtId: formData.courtId,
            dateStr: dateStr,
            startTimeStr: formData.startTime,
            endTimeStr: formData.endTime,
            type: formData.type,
            clientName: formData.clientName
        };

        const res = await createAdminBooking(payload as any);

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

    // Estilos visuales Premium para los bloques ocupados
    const getBlockStyle = (status: string) => {
        if (status === 'BLOCKED') return 'bg-red-50 border-l-red-500 text-red-900 shadow-red-100';
        if (status === 'FIXED') return 'bg-purple-50 border-l-purple-500 text-purple-900 shadow-purple-100';
        return 'bg-emerald-100 border-l-emerald-500 text-emerald-900 shadow-emerald-100'; // CONFIRMED
    };

    const getIcon = (status: string) => {
        if (status === 'BLOCKED') return <Lock className="w-3.5 h-3.5 text-red-600 mr-1.5" />;
        if (status === 'FIXED') return <CalendarCheck className="w-3.5 h-3.5 text-purple-600 mr-1.5" />;
        return <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />;
    };

    return (
        <div className="space-y-6">
            {/* Controles de Navegación Estilo Premium */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="rounded-full w-10 h-10 p-0 hover:bg-slate-50" onClick={() => changeDay(-1)}>
                        <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div className="font-bold text-xl min-w-[220px] text-center text-slate-800 dark:text-slate-100 capitalize">
                        {currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </div>
                    <Button variant="outline" className="rounded-full w-10 h-10 p-0 hover:bg-slate-50" onClick={() => changeDay(1)}>
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                    </Button>
                    <Button variant="secondary" className="ml-2 rounded-xl px-6 font-semibold shadow-sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-4 text-sm font-semibold text-slate-600 dark:text-slate-300 mr-4">
                        <div className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 shadow-sm"></span> Reserva</div>
                        <div className="flex items-center"><span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2 shadow-sm"></span> Bloqueo</div>
                        <div className="flex items-center"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-2 shadow-sm"></span> Fijo</div>
                    </div>
                    <select
                        value={selectedCourtFilter}
                        onChange={(e) => setSelectedCourtFilter(e.target.value)}
                        className="border-slate-200 rounded-xl shadow-sm p-2.5 text-sm font-semibold bg-white text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                        <option value="ALL">Todas las Canchas</option>
                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Grilla Matricial Ultra Premium */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th className="w-20 border-b border-r border-slate-200 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md p-4 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                    Hora
                                </th>
                                {visibleCourts.map(court => (
                                    <th key={court.id} className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md p-4 text-slate-800 dark:text-slate-100 font-bold text-center text-sm uppercase tracking-wide">
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
                                    <tr key={time}>
                                        {/* Columna de Horarios */}
                                        <td className="border-r border-slate-200 dark:border-slate-800/50 relative bg-white dark:bg-slate-900 w-20">
                                            <div className={`absolute top-0 right-3 -mt-2.5 text-xs font-bold ${isHour ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                                                {time}
                                            </div>
                                            {/* Línea sutil separadora de hora */}
                                            <div className="absolute top-0 right-0 w-2 border-t border-slate-200 dark:border-slate-700"></div>
                                        </td>

                                        {/* Columnas de Canchas */}
                                        {visibleCourts.map((court, colIndex) => {
                                            const startingBooking = bookings.find(b => b.courtId === court.id && new Date(b.startTime).getTime() === slotDateTime.getTime());

                                            // 1. RENDERIZAR TURNO OCUPADO
                                            if (startingBooking) {
                                                const durationMins = (new Date(startingBooking.endTime).getTime() - new Date(startingBooking.startTime).getTime()) / 60000;
                                                const rowSpan = Math.max(1, Math.ceil(durationMins / 30));

                                                return (
                                                    <td key={court.id} rowSpan={rowSpan} className="p-0.5 border-b border-r border-slate-200 dark:border-slate-800 align-top relative">
                                                        <div
                                                            onClick={() => { setSelectedBooking(startingBooking); setModalMode('VIEW'); setModalOpen(true); }}
                                                            className={`absolute inset-0.5 rounded-lg border-l-4 p-3 cursor-pointer transition-all hover:brightness-95 shadow-sm overflow-hidden flex flex-col justify-start ${getBlockStyle(startingBooking.status)}`}
                                                        >
                                                            <div className="flex items-center font-bold text-sm mb-1">
                                                                {getIcon(startingBooking.status)}
                                                                {new Date(startingBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(startingBooking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="text-sm font-semibold opacity-90 ml-5 flex items-center mt-1">
                                                                <User className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                                <span className="truncate">{startingBooking.user?.name || startingBooking.description || 'Turno Registrado'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Verificar si el bloque está pisado por un rowSpan anterior
                                            const isOverlapped = bookings.some(b => {
                                                if (b.courtId !== court.id) return false;
                                                const start = new Date(b.startTime).getTime();
                                                const end = new Date(b.endTime).getTime();
                                                const current = slotDateTime.getTime();
                                                return current > start && current < end;
                                            });

                                            if (isOverlapped) return null;

                                            // 2. RENDERIZAR ESPACIO LIBRE (VERDE)
                                            return (
                                                <td
                                                    key={court.id}
                                                    className={`p-0 border-b border-r border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer group h-[52px] ${colIndex === visibleCourts.length - 1 ? 'border-r-0' : ''}`}
                                                    onClick={() => handleEmptyClick(court.id, time)}
                                                >
                                                    <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                                                        <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Reservar {time}
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

            {/* MODAL MANTIENE SU DISEÑO LIMPIO */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-2xl">
                    {modalMode === 'CREATE' ? (
                        <>
                            <DialogHeader><DialogTitle className="text-xl font-bold">Agendar Turno</DialogTitle></DialogHeader>

                            {dbError && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md text-sm font-mono overflow-x-auto">
                                    <strong>Error de BD:</strong><br />{dbError}
                                </div>
                            )}

                            <div className="space-y-5 mt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600 font-semibold">Hora Inicio</Label>
                                        <Input type="time" className="rounded-xl font-medium" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-600 font-semibold">Hora Fin</Label>
                                        <Input type="time" className="rounded-xl font-medium" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold">Tipo de Acción</Label>
                                    <select
                                        className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        value={formData.type}
                                        onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="RESERVA">🎾 Reserva de Cliente (Local)</option>
                                        <option value="FIJO">📅 Abono Fijo (Recurrente)</option>
                                        <option value="BLOQUEO">🔒 Bloqueo (Mantenimiento / Lluvia)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-slate-600 font-semibold">{formData.type === 'BLOQUEO' ? 'Motivo del bloqueo' : 'Nombre del Cliente'}</Label>
                                    <Input
                                        className="rounded-xl font-medium"
                                        placeholder={formData.type === 'BLOQUEO' ? 'Ej: Lluvia / Reparación' : 'Ej: Juan Pérez'}
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-5 border-t border-slate-100">
                                    <Button variant="ghost" className="rounded-xl font-semibold" onClick={() => setModalOpen(false)}>Cancelar</Button>
                                    <Button onClick={submitCreate} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm">
                                        Confirmar Turno
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : selectedBooking && (
                        <>
                            <DialogHeader><DialogTitle className="text-xl font-bold">Detalle del Turno</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                        <span className="text-sm font-semibold text-slate-500">Cancha</span>
                                        <span className="font-bold text-slate-800">{selectedBooking.court.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                        <span className="text-sm font-semibold text-slate-500 flex items-center"><Clock className="w-4 h-4 mr-1.5" /> Horario</span>
                                        <span className="font-bold text-emerald-600">
                                            {new Date(selectedBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} a {new Date(selectedBooking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                        <span className="text-sm font-semibold text-slate-500 flex items-center"><User className="w-4 h-4 mr-1.5" /> Titular</span>
                                        <span className="font-bold text-slate-800">{selectedBooking.user?.name || selectedBooking.description || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-sm font-semibold text-slate-500">Estado</span>
                                        <span className={`font-bold uppercase text-[10px] px-2.5 py-1 rounded-full ${selectedBooking.status === 'BLOCKED' ? 'bg-red-100 text-red-700' :
                                                selectedBooking.status === 'FIXED' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {selectedBooking.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="destructive" className="rounded-xl font-bold bg-red-500 hover:bg-red-600 shadow-sm" onClick={handleCancelBooking}>Borrar Turno</Button>
                                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setModalOpen(false)}>Cerrar</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}