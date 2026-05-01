'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBookingsByDate } from '@/actions/bookings';

// Helper para formatear fecha a YYYY-MM-DD local
const formatDate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

export default function CalendarGrid({ activeCourts }: { activeCourts: any[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDayBookings = async (date: Date) => {
        setLoading(true);
        const dateStr = formatDate(date);
        const res = await getBookingsByDate(dateStr);
        if (res.success && res.data) {
            setBookings(res.data);
        } else {
            setBookings([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDayBookings(currentDate);
    }, [currentDate]);

    const changeDay = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Controles de fecha */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
                <Button variant="outline" onClick={() => changeDay(-1)}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <div className="flex items-center space-x-2 text-lg font-semibold">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span>
                        {currentDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
                <Button variant="outline" onClick={() => changeDay(1)}>
                    Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>

            {/* Grilla de Reservas */}
            {loading ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">Cargando agenda...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCourts.map((court) => {
                        const courtBookings = bookings.filter(b => b.courtId === court.id);

                        return (
                            <Card key={court.id} className="overflow-hidden">
                                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b pb-3">
                                    <CardTitle className="text-lg flex justify-between items-center">
                                        {court.name}
                                        <Badge variant="outline">{court.sport}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {courtBookings.length > 0 ? (
                                        <div className="divide-y dark:divide-slate-800">
                                            {courtBookings.map((booking) => (
                                                <div key={booking.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-slate-100">
                                                            {new Date(booking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-sm text-slate-500">
                                                            {booking.user?.name || booking.user?.email || 'Usuario Local'}
                                                        </div>
                                                    </div>
                                                    <Badge className={getStatusColor(booking.status)} variant="secondary">
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-sm">
                                            Sin reservas para este día
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}