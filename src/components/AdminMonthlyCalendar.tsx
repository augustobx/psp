'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, X, Clock, MapPin, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMonthlyStats } from '@/actions/monthly-calendar';
import { getHistoryBookings } from '@/actions/history';

export default function AdminMonthlyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const loadStats = async (date: Date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const res = await getMonthlyStats(year, month);
    if (res.success && res.data) {
      setStats(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats(currentMonth);
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = async (day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
    setLoadingDay(true);
    setDayBookings([]);

    const dateStr = format(day, 'yyyy-MM-dd');
    const res = await getHistoryBookings(dateStr, dateStr);
    
    if (res.success && res.data) {
      setDayBookings(res.data);
    }
    setLoadingDay(false);
  };

  // Render Calendar Grid
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-3xl">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </Button>
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-emerald-500" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tight">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 }); // Monday

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-bold text-xs text-slate-500 dark:text-slate-400 uppercase py-4 border-b border-slate-200 dark:border-slate-800">
          {format(addDays(startDate, i), 'EEEE', { locale: es })}
        </div>
      );
    }

    return <div className="grid grid-cols-7 bg-slate-50/80 dark:bg-slate-900/50">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const dateKey = format(day, 'yyyy-MM-dd');
        const bookingsCount = stats[dateKey] || 0;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={`min-h-[120px] md:min-h-[140px] p-3 border-r border-b border-slate-200 dark:border-slate-800 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 relative flex flex-col items-center justify-start group
              ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 opacity-60' : 'bg-white dark:bg-slate-900'}
            `}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-2 transition-colors
              ${isToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}
            `}>
              {formattedDate}
            </div>
            
            {bookingsCount > 0 ? (
              <div className="flex flex-col items-center gap-1.5 w-full">
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full text-center w-full max-w-[100px] shadow-sm">
                  {bookingsCount} {bookingsCount === 1 ? 'Turno' : 'Turnos'}
                </span>
                <div className="flex flex-wrap justify-center gap-1 px-1">
                  {Array.from({ length: Math.min(bookingsCount, 6) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                  ))}
                  {bookingsCount > 6 && <span className="text-[10px] text-slate-400 leading-none ml-0.5">+{bookingsCount - 6}</span>}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-300 dark:text-slate-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-1">Libre</span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      )}
      {rows}
    </div>;
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      {/* MODAL DE TURNOS DEL DÍA */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="bg-slate-50 dark:bg-slate-800 p-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black text-lg">
                  {format(selectedDate, 'd')}
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white capitalize">
                    {format(selectedDate, 'EEEE', { locale: es })}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
                    {format(selectedDate, 'MMMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900">
              {loadingDay ? (
                <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Cargando turnos...</p>
                </div>
              ) : dayBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Día sin turnos</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[250px]">
                    No se encontraron reservas registradas para esta fecha.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayBookings.map((booking) => (
                    <div key={booking.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                      
                      {/* Horario y Cancha */}
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[70px]">
                          <span className="block text-lg font-black text-slate-800 dark:text-white">
                            {format(new Date(booking.startTime), 'HH:mm')}
                          </span>
                          <span className="block text-xs font-bold text-slate-400">
                            a {format(new Date(booking.endTime), 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                        
                        <div>
                          <div className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {booking.court?.name || 'Cancha'}
                          </div>
                          {booking.status !== 'BLOCKED' ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center">
                                <User className="w-3.5 h-3.5 text-slate-400 mr-1.5" /> 
                                {booking.user?.name || 'Cliente local'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-500 flex items-center">
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                              Bloqueo Administrativo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="flex items-center sm:justify-end">
                        {booking.status === 'CONFIRMED' && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmado</span>}
                        {booking.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3.5 h-3.5 mr-1" /> Pendiente</span>}
                        {booking.status === 'FIXED' && <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><CalendarIcon className="w-3.5 h-3.5 mr-1" /> Fijo</span>}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800">
              <Button 
                onClick={() => router.push(`/admin/calendar?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold h-12 rounded-xl"
              >
                Ir al calendario de este día
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
