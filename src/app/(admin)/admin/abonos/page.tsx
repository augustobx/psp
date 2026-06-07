'use client';

import { useState, useEffect } from 'react';
import { Trash2, Clock, Calendar, MapPin, User, Loader2, Search, Filter } from 'lucide-react';
import { getFixedBookings, deleteFixedBooking } from '@/actions/fixed-bookings';

interface FixedBooking {
  id: string;
  court: { name: string };
  user: { name: string, phone: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  _count: { bookings: number };
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AbonosPage() {
  const [abonos, setAbonos] = useState<FixedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterDay, setFilterDay] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ACTIVE');

  useEffect(() => {
    fetchAbonos();
  }, []);

  const fetchAbonos = async () => {
    setLoading(true);
    const res = await getFixedBookings();
    if (res.success && res.data) {
      setAbonos(res.data as any);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de cancelar este abono fijo? Se liberarán todos los turnos futuros asociados a él.')) return;
    
    setDeletingId(id);
    const res = await deleteFixedBooking(id);
    if (res.success) {
      setAbonos(abonos.filter(a => a.id !== id));
    } else {
      alert(res.error || 'Error al eliminar');
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Gestión de Abonos Fijos</h1>
        <p className="text-slate-500 font-medium">Administra y cancela las reservas recurrentes de tus clientes.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
          >
            <option value="ALL">Todos los Días</option>
            {DAYS.map((day, idx) => (
              <option key={idx} value={idx.toString()}>{day}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {(() => {
        const filtered = abonos.filter(a => {
          const matchSearch = a.user.name.toLowerCase().includes(search.toLowerCase()) || a.user.phone.includes(search);
          const matchDay = filterDay === 'ALL' || a.dayOfWeek.toString() === filterDay;
          const matchStatus = filterStatus === 'ALL' ? true : (filterStatus === 'ACTIVE' ? a.isActive : !a.isActive);
          return matchSearch && matchDay && matchStatus;
        });

        if (filtered.length === 0) {
          return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-500 font-medium">No se encontraron abonos fijos con los filtros actuales.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((abono) => (
              <div key={abono.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${!abono.isActive ? 'opacity-50 border-red-200' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Calendar className="w-5 h-5" />
                      <span>{DAYS[abono.dayOfWeek]}</span>
                    </div>
                    {!abono.isActive && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">CANCELADO</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium text-sm">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      {abono.startTime} - {abono.endTime} hs
                    </div>
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                      {abono.court.name}
                    </div>
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium text-sm">
                      <User className="w-4 h-4 mr-2 text-slate-400" />
                      {abono.user.name || 'Sin Nombre'} ({abono.user.phone})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500">
                      Vigencia: {new Date(abono.startDate).toLocaleDateString()} al {new Date(abono.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      Turnos generados vivos: {abono._count.bookings}
                    </p>
                  </div>
                </div>

                {abono.isActive && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleDelete(abono.id)}
                      disabled={deletingId === abono.id}
                      className="flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                    >
                      {deletingId === abono.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Cancelar Abono
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
