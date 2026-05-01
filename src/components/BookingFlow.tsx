'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRight, CheckCircle2, User, Phone, Mail } from 'lucide-react';
import { getAvailableSlots } from '@/actions/public-bookings';

export default function BookingFlow({ courts }: { courts: any[] }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Formulario de Cliente
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  // Generar los próximos 7 días
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Efecto para buscar horarios cuando cambia la cancha o el día
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      setLoading(true);
      const dateStr = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      getAvailableSlots(selectedCourt, dateStr).then(res => {
        if (res.success && res.data) {
          setAvailableSlots(res.data as any);
        } else {
          setAvailableSlots([]);
        }
        setLoading(false);
        setSelectedSlot(''); // Reseteamos el horario si cambia de día
      });
    }
  }, [selectedCourt, selectedDate]);

  const handleNextStep = () => {
    if (step === 1 && selectedCourt && selectedSlot) setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ACA VA LA LÓGICA DE GUARDAR O REDIRIGIR A MERCADO PAGO
    console.log("Enviando a Mercado Pago:", { selectedCourt, selectedDate, selectedSlot, formData });

    // Simulamos un delay de carga
    setTimeout(() => {
      setStep(3); // Pantalla de éxito
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl min-h-[85vh] md:min-h-0 md:rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col relative">

      {/* HEADER DE LA PWA */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white text-center shadow-md relative z-10">
        <h2 className="text-2xl font-black tracking-tight flex items-center justify-center">
          🎾 Reservá tu Cancha
        </h2>
        <p className="text-emerald-100 text-sm mt-1 font-medium">Rápido, fácil y desde el celu</p>
      </div>

      <div className="p-5 flex-1 overflow-y-auto pb-24 space-y-8">

        {/* --- PASO 1: ELECCIÓN DE TURNO --- */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Fechas (Scroll Horizontal) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1.5 text-emerald-500" /> ¿Qué día jugás?
              </label>
              <div className="flex space-x-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                {upcomingDays.map((date, i) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-[4.5rem] p-3 rounded-2xl flex flex-col items-center justify-center transition-all snap-start shadow-sm border ${isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 scale-105 ring-4 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-xs uppercase font-bold opacity-80">
                        {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                      </span>
                      <span className="text-xl font-black mt-0.5">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canchas (Cards) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" /> Elegí tu cancha
              </label>
              <div className="grid grid-cols-2 gap-3">
                {courts.map(court => (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourt(court.id)}
                    className={`p-4 rounded-2xl text-left transition-all border shadow-sm flex flex-col ${selectedCourt === court.id
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                  >
                    <span className="font-bold text-lg">{court.name}</span>
                    <span className="text-xs opacity-70 mt-1 font-medium">{court.surface || 'Piso Sintético'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios (Pills) */}
            {selectedCourt && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-emerald-500" /> Horarios Libres
                </label>

                {loading ? (
                  <div className="flex justify-center p-6"><div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedSlot(time)}
                        className={`py-3 rounded-xl font-bold text-sm transition-all border shadow-sm ${selectedSlot === time
                            ? 'bg-slate-900 text-white border-slate-900 scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600'
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-sm font-medium">
                    Uy, esta cancha ya está a full este día. ¡Probá con otra!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- PASO 2: DATOS DEL CLIENTE --- */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex justify-between items-center mb-6">
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tu Reserva</p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} • {selectedSlot} hs
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-emerald-600 underline">Cambiar</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center"><User className="w-4 h-4 mr-1.5 text-slate-400" /> Nombre y Apellido</label>
                <input
                  required type="text" placeholder="Ej: Augusto Basquez"
                  className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center"><Phone className="w-4 h-4 mr-1.5 text-slate-400" /> WhatsApp</label>
                <input
                  required type="tel" placeholder="Ej: 3329 123456"
                  className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center"><Mail className="w-4 h-4 mr-1.5 text-slate-400" /> Email <span className="text-xs text-slate-400 ml-1 font-normal">(Para el recibo)</span></label>
                <input
                  required type="email" placeholder="tu@email.com"
                  className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </form>
        )}

        {/* --- PASO 3: ÉXITO --- */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center py-10 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">¡Reserva Confirmada!</h3>
            <p className="text-slate-500 font-medium px-4">
              Te enviamos un WhatsApp con el comprobante. ¡Prepará la paleta que se juega!
            </p>
            <button onClick={() => window.location.reload()} className="mt-8 font-bold text-emerald-600 bg-emerald-50 py-3 px-6 rounded-xl">
              Sacar otro turno
            </button>
          </div>
        )}
      </div>

      {/* FOOTER FLOTANTE PWA */}
      {step < 3 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
          {step === 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!selectedCourt || !selectedSlot}
              className="w-full flex items-center justify-center bg-slate-900 text-white font-bold text-lg py-4 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-slate-800"
            >
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center bg-emerald-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600"
            >
              {loading ? 'Procesando...' : 'Pagar Seña y Reservar'}
            </button>
          )}
        </div>
      )}

      {/* Estilo para ocultar la barra de scroll en navegadores webkit */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}