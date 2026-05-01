'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAdminDayBookings, createAdminBooking, cancelAdminBooking } from '@/actions/admin-calendar';

const START_HOUR = 8; // 08:00
const END_HOUR = 23;  // 23:00
const MINUTE_HEIGHT = 1.5; // 1 minuto = 1.5 pixels (Una hora = 90px)

export default function AdminCalendar({ courts }: { courts: any[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCourtFilter, setSelectedCourtFilter] = useState('ALL');

    // Estado del Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'CREATE' | 'VIEW'>('CREATE');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Formulario de creación
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

    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

    // Calcula top y height absoluto en base a la hora
    const getBookingStyle = (startTime: Date, endTime: Date) => {
        const startMins = (startTime.getHours() * 60 + startTime.getMinutes()) - (START_HOUR * 60);
        const durationMins = (endTime.getTime() - startTime.getTime()) / 60000;
        return {
            top: `${startMins * MINUTE_HEIGHT}px`,
            height: `${durationMins * MINUTE_HEIGHT}px`,
        };
    };

    const handleEmptyClick = (courtId: string, hour: number, minutes: number) => {
        const startStr = `${hour.toString().padStart(2, '0')}:${minutes === 0 ? '00' : '30'}`;
        // Calcular fin por defecto (+90 min)
        const endMins = hour * 60 + minutes + 90;
        const endHour = Math.floor(endMins / 60).toString().padStart(2, '0');
        const endMinStr = (endMins % 60).toString().padStart(2, '0');

        setFormData({
            courtId,
            startTime: startStr,
            endTime: `${endHour}:${endMinStr}`,
            type: 'RESERVA',
            clientName: ''
        });
        setModalMode('CREATE');
        setModalOpen(true);
    };

    const handleBookingClick = (booking: any) => {
        setSelectedBooking(booking);
        setModalMode('VIEW');
        setModalOpen(true);
    };

    const submitCreate = async () => {
        const dateStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const res = await createAdminBooking({ ...formData, dateStr } as any);
        if (res.success) {
            setModalOpen(false);
            loadData(currentDate);
        } else {
            alert(res.error);
        }
    };

    const handleCancelBooking = async () => {
        if (confirm('¿Estás seguro de cancelar esto?')) {
            await cancelAdminBooking(selectedBooking.id);
            setModalOpen(false);
            loadData(currentDate);
        }
    };

    const getBackgroundColor = (status: string) => {
        if (status === 'BLOCKED') return 'bg-red-500 border-red-600 text-white';
        if (status === 'FIXED') return 'bg-purple-500 border-purple-600 text-white';
        if (status === 'PENDING') return 'bg-yellow-400 border-yellow-500 text-slate-900';
        return 'bg-emerald-500 border-emerald-600 text-white'; // CONFIRMED
    };

    return (
        <div className="space-y-4">
            {/* Barra de Controles Superior */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => changeDay(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="font-bold text-lg min-w-[200px] text-center">
                        {currentDate.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <Button variant="outline" onClick={() => changeDay(1)}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm">
                        <div className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-full mr-1"></span> Reserva</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span> Bloqueo</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span> Fijo</div>
                    </div>

                    <select
                        value={selectedCourtFilter}
                        onChange={(e) => setSelectedCourtFilter(e.target.value)}
                        className="border-slate-300 rounded-md shadow-sm p-2 text-sm dark:bg-slate-800 dark:border-slate-700"
                    >
                        <option value="ALL">Todas las Canchas</option>
                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Grilla Principal */}
            <div className="bg-white dark:bg-slate-900 border rounded-xl shadow-sm overflow-hidden flex">
                {/* Columna de Horas */}
                <div className="w-16 flex-shrink-0 border-r bg-slate-50 dark:bg-slate-800/50">
                    <div className="h-12 border-b"></div> {/* Espacio del header */}
                    <div className="relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * 60 * MINUTE_HEIGHT}px` }}>
                        {hours.map(hour => (
                            <div key={hour} className="absolute w-full text-right pr-2 text-xs text-slate-500 font-medium" style={{ top: `${(hour - START_HOUR) * 60 * MINUTE_HEIGHT - 8}px` }}>
                                {hour}:00
                            </div>
                        ))}
                    </div>
                </div>

                {/* Columnas de Canchas */}
                <div className="flex-1 flex overflow-x-auto">
                    {visibleCourts.map((court) => {
                        const courtBookings = bookings.filter(b => b.courtId === court.id);

                        return (
                            <div key={court.id} className="flex-1 min-w-[200px] border-r last:border-r-0 relative">
                                {/* Header Cancha */}
                                <div className="h-12 border-b bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center font-bold text-sm sticky top-0 z-20">
                                    {court.name}
                                </div>

                                {/* Contenedor de la Grilla Absolute */}
                                <div className="relative w-full" style={{ height: `${(END_HOUR - START_HOUR + 1) * 60 * MINUTE_HEIGHT}px` }}>

                                    {/* Líneas divisorias y celdas clickeables de fondo (cada 30 min) */}
                                    {hours.map(hour => (
                                        <div key={hour}>
                                            <div
                                                className="absolute w-full border-t border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors z-0"
                                                style={{ top: `${(hour - START_HOUR) * 60 * MINUTE_HEIGHT}px`, height: `${30 * MINUTE_HEIGHT}px` }}
                                                onClick={() => handleEmptyClick(court.id, hour, 0)}
                                            />
                                            <div
                                                className="absolute w-full border-t border-slate-50 dark:border-slate-800/30 border-dashed cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors z-0"
                                                style={{ top: `${((hour - START_HOUR) * 60 + 30) * MINUTE_HEIGHT}px`, height: `${30 * MINUTE_HEIGHT}px` }}
                                                onClick={() => handleEmptyClick(court.id, hour, 30)}
                                            />
                                        </div>
                                    ))}

                                    {/* Renderizado de Bloques de Reservas (Z-Index alto para tapar el fondo) */}
                                    {courtBookings.map(booking => {
                                        const start = new Date(booking.startTime);
                                        const end = new Date(booking.endTime);
                                        const styles = getBookingStyle(start, end);

                                        return (
                                            <div
                                                key={booking.id}
                                                className={`absolute left-1 right-1 rounded-md border p-1 shadow-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-10 flex flex-col justify-start text-xs ${getBackgroundColor(booking.status)}`}
                                                style={styles}
                                                onClick={() => handleBookingClick(booking)}
                                            >
                                                <div className="font-bold">
                                                    {start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="truncate opacity-90 mt-0.5">
                                                    {booking.user?.name || booking.description || 'Cliente Local'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL MULTIUSO (CREAR / VER) */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    {modalMode === 'CREATE' ? (
                        <>
                            <DialogHeader><DialogTitle>Agendar Turno Manual</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Hora Inicio</Label>
                                        <Input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Hora Fin</Label>
                                        <Input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <Label>Tipo de Acción</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                                        value={formData.type}
                                        onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="RESERVA">Reserva Local</option>
                                        <option value="BLOQUEO">Bloqueo de Cancha</option>
                                        <option value="FIJO">Abono Fijo</option>
                                    </select>
                                </div>

                                <div>
                                    <Label>Nombre / Motivo</Label>
                                    <Input
                                        placeholder={formData.type === 'RESERVA' ? 'Ej: Juan Perez' : 'Ej: Mantenimiento'}
                                        value={formData.clientName}
                                        onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                                    <Button onClick={submitCreate} className="bg-blue-600 text-white">Guardar</Button>
                                </div>
                            </div>
                        </>
                    ) : selectedBooking && (
                        <>
                            <DialogHeader><DialogTitle>Detalles del Turno</DialogTitle></DialogHeader>
                            <div className="space-y-3 mt-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
                                    <p className="text-sm font-medium">Cancha: <span className="font-normal">{selectedBooking.court.name}</span></p>
                                    <p className="text-sm font-medium">Horario: <span className="font-normal">
                                        {new Date(selectedBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} a {new Date(selectedBooking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </span></p>
                                    <p className="text-sm font-medium">Titular: <span className="font-normal">
                                        {selectedBooking.user?.name || selectedBooking.description || 'N/A'}
                                    </span></p>
                                    <p className="text-sm font-medium">Estado: <span className="font-normal">{selectedBooking.status}</span></p>
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cerrar</Button>
                                    <Button variant="destructive" onClick={handleCancelBooking}>Cancelar / Borrar Turno</Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}