'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, User, Phone, Info, Trash2 } from 'lucide-react';
import { getAdminCalendarData, createAdminBooking, cancelAdminBooking } from '@/actions/admin-calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminCalendar({ courts }: { courts: any[] }) {
    const [selectedCourt, setSelectedCourt] = useState(courts[0]?.id || '');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!selectedCourt) return;
        setLoading(true);
        const res = await getAdminCalendarData(selectedCourt, format(currentDate, 'yyyy-MM-dd'));
        if (res.success) setData(res.data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [selectedCourt, currentDate]);

    const handleCancel = async (id: string) => {
        if (confirm('¿Cancelar este turno?')) {
            const res = await cancelAdminBooking(id);
            if (res.success) loadData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() - 1);
                        setCurrentDate(d);
                    }}><ChevronLeft /></Button>
                    <div className="font-black text-xl min-w-[240px] text-center uppercase">
                        {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
                    </div>
                    <Button variant="ghost" onClick={() => {
                        const d = new Date(currentDate);
                        d.setDate(d.getDate() + 1);
                        setCurrentDate(d);
                    }}><ChevronRight /></Button>
                </div>
                <select
                    value={selectedCourt}
                    onChange={(e) => setSelectedCourt(e.target.value)}
                    className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold outline-none"
                >
                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse font-bold text-slate-500">Cargando...</div>
            ) : data?.slots?.map((slot: any, idx: number) => (
                <div key={idx} className={`flex items-center gap-4 p-5 rounded-[2rem] border mb-3 ${slot.status === 'FREE' ? 'bg-white' : 'bg-slate-50 opacity-80'}`}>
                    <div className="min-w-[80px] text-center">
                        <div className="text-xl font-black">{slot.time}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Fin {slot.endTime}</div>
                    </div>
                    <div className="flex-1">
                        {slot.status === 'FREE' ? (
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-500 font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Disponible
                                </span>
                                <Button size="sm" className="bg-emerald-500 text-white rounded-xl"><Plus className="w-4 h-4 mr-1" /> Reserva Manual</Button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-bold">{slot.booking?.user?.name || 'Cliente LocaL'}</div>
                                    <div className="text-sm text-slate-500">{slot.booking?.user?.phone}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge>{slot.status}</Badge>
                                    <Button variant="ghost" size="icon" onClick={() => handleCancel(slot.booking.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}