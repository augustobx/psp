'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRight, CheckCircle2, User, Phone, Mail, Lock } from 'lucide-react';
import { getAvailableSlots } from '@/actions/public-bookings';

interface SlotData {
  time: string;
  status: string;
}

export default function BookingFlow({ courts }: { courts: any[] }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      setLoading(true);
      const dateStr = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      getAvailableSlots(selectedCourt, dateStr).then(res => {
        if (res.success && res.data) {
          setSlots(res.data as SlotData[]);
        } else {
          setSlots([]);
        }
        setLoading(false);
        setSelectedSlot('');
      });
    }
  }, [selectedCourt, selectedDate]);

  const handleNextStep = () => {
    if (step === 1 && selectedCourt && selectedSlot) setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="w-full h-full md:h-auto min-h-screen md:min-h-0 bg-white dark:bg-slate-900 md:rounded-[2rem] md:shadow-2xl md:border md:border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative">

      {/* SPLASH HEADER CON LOGO */}
      <div className="bg-slate-900 dark:bg-black p-6 pb-8 text-white relative z-10 rounded-b-[2rem] shadow-lg">
        {/* Pseudo-Logo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center font-black text-slate-900 text-xs">
              PSP
            </div>
            <span className="font-bold tracking-tight text-lg opacity-90">Padel Club</span>
          </div>
        </div>

        <h2 className="text-3xl font-black tracking-tight mt-2 flex items-center">
          Reservá tu <br /> Cancha 🎾
        </h2>
      </div>

      <div className="p-5 flex-1 overflow-y-auto pb-28 space-y-8 -mt-4">

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">

            {/* Fechas */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-emerald-500" /> ¿Qué día jugás?
              </label>
              <div className="flex space-x-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                {upcomingDays.map((date, i) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-16 p-3 rounded-2xl flex flex-col items-center justify-center transition-all snap-start shadow-sm border ${isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 ring-4 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80 mb-1">
                        {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                      </span>
                      <span className="text-2xl font-black leading-none">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canchas */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-emerald-500" /> Elegí tu cancha
              </label>
              <div className="grid grid-cols-2 gap-3">
                {courts.map(court => (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourt(court.id)}
                    className={`p-4 rounded-2xl text-left transition-all border shadow-sm flex flex-col ${selectedCourt === court.id
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                  >
                    <span className="font-bold text-base">{court.name}</span>
                    <span className="text-[11px] uppercase opacity-60 mt-1 font-bold">{court.surface || 'Piso Sintético'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios FOMO (Grilla Visual de Ocupación) */}
            {selectedCourt && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-emerald-500" /> Horarios</div>
                  {/* Leyenda chiquita */}
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Libre</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-300 mr-1"></span>Ocupado</span>
                  </div>
                </label>

                {loading ? (
                  <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot, idx) => {
                      const isAvailable = slot.status === 'AVAILABLE';
                      const isSelected = selectedSlot === slot.time;

                      return (
                        <button
                          key={idx}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`relative p-3.5 rounded-2xl text-center font-bold text-sm transition-all border overflow-hidden flex flex-col items-center justify-center
                            ${isAvailable
                              ? isSelected
                                ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-900/20 shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 hover:text-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                            }
                          `}
                        >
                          <span className="text-lg">{slot.time} hs</span>

                          {/* Etiqueta debajo de la hora */}
                          <span className="text-[10px] uppercase tracking-wider mt-0.5 opacity-80">
                            {isAvailable ? (isSelected ? 'Seleccionado' : 'Disponible') :
                              slot.status === 'FIXED' ? 'Abono Fijo' :
                                slot.status === 'BLOCKED' ? 'Cancha Cerrada' : 'Ocupado'}
                          </span>

                          {/* Icono de candado de fondo si está bloqueado/ocupado */}
                          {!isAvailable && (
                            <Lock className="absolute -right-2 -bottom-2 w-10 h-10 text-slate-200 dark:text-slate-700 opacity-50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-sm font-medium">
                    No hay horarios configurados para este día.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 2 Y 3 QUEDAN IGUAL - LO OMITO EN ESTE SNIPPET PARA NO HACERLO LARGO, DEJÁ EL CÓDIGO DE LOS PASOS 2 Y 3 QUE YA TENÍAS */}

        {/* --- PASO 2: DATOS DEL CLIENTE --- */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in slide-in-from-right-8 duration-500 pt-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Resumen de Reserva</p>
                <p className="text-sm font-bold">
                  {selectedDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace(/^\w/, c => c.toUpperCase())} • {selectedSlot} hs
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">Modificar</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center"><User className="w-4 h-4 mr-2 text-slate-400" /> Nombre y Apellido</label>
                <input required type="text" placeholder="Ej: Augusto Basquez" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400" /> WhatsApp</label>
                <input required type="tel" placeholder="Ej: 3329 123456" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center"><Mail className="w-4 h-4 mr-2 text-slate-400" /> Email</label>
                <input required type="email" placeholder="tu@email.com" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
          </form>
        )}

        {/* --- PASO 3: ÉXITO --- */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 absolute" />
              <div className="w-24 h-24 border-4 border-emerald-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">¡Confirmado!</h3>
            <p className="text-slate-500 font-medium px-4 leading-relaxed">
              Tu lugar está asegurado. Te enviamos los detalles por WhatsApp. ¡A romperla! 🎾
            </p>
            <button onClick={() => window.location.reload()} className="mt-8 font-bold text-slate-900 bg-slate-100 py-4 px-8 rounded-2xl hover:bg-slate-200 transition-colors">
              Volver al inicio
            </button>
          </div>
        )}
      </div>

      {/* FOOTER FLOTANTE PWA */}
      {step < 3 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
          {step === 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!selectedCourt || !selectedSlot}
              className="w-full flex items-center justify-center bg-emerald-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-emerald-600 active:scale-[0.98]"
            >
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center bg-slate-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl transition-all hover:bg-black active:scale-[0.98]"
            >
              {loading ? 'Procesando...' : 'Pagar Seña y Reservar'}
            </button>
          )}
        </div>
      )}

      {/* CSS para la barra de scroll horizontal invisible */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}