'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMonthlyStats } from '@/actions/monthly-calendar';

export default function AdminMonthlyCalendar() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

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

  const onDateClick = (day: Date) => {
    // Navigate to daily calendar with selected date
    const dateStr = format(day, 'yyyy-MM-dd');
    router.push(`/admin/calendar?date=${dateStr}`);
  };

  // Render Calendar Grid
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-3xl">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full">
          <ChevronLeft className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full">
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
        <div key={i} className="text-center font-bold text-sm text-slate-500 dark:text-slate-400 uppercase py-3 border-b border-slate-200 dark:border-slate-800">
          {format(addDays(startDate, i), 'EEE', { locale: es })}
        </div>
      );
    }

    return <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/50">{days}</div>;
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
            className={`min-h-[100px] md:min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-800 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 relative
              ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/30 text-slate-400' : 'bg-white dark:bg-slate-900'}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full
                ${isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-700 dark:text-slate-300'}
              `}>
                {formattedDate}
              </span>
              
              {bookingsCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-lg">
                  {bookingsCount} {bookingsCount === 1 ? 'turno' : 'turnos'}
                </span>
              )}
            </div>

            {/* Visual Indicator of busyness (optional) */}
            <div className="absolute bottom-2 left-2 right-2 flex gap-1 mt-2">
              {bookingsCount > 0 && Array.from({ length: Math.min(bookingsCount, 5) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              ))}
              {bookingsCount > 5 && <span className="text-[10px] text-slate-400 leading-none">+{bookingsCount - 5}</span>}
            </div>
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
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      )}
      {rows}
    </div>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
