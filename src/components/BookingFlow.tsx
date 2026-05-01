'use client';

import { useState, useEffect } from 'react';
import { Court } from '@prisma/client';
import { getAvailableSlots, createBooking } from '@/actions/bookings';

interface BookingFlowProps {
  courts: Court[];
}

interface Slot {
  start: string;
  end: string;
}

export default function BookingFlow({ courts }: BookingFlowProps) {
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // TODO: En producción, este ID debería venir de la sesión del usuario (Auth)
  const [userId, setUserId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cargar turnos disponibles cuando cambia la cancha o la fecha
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      setLoading(true);
      getAvailableSlots(selectedCourt, selectedDate)
        .then((response) => {
          // Verificamos que la acción haya sido exitosa y extraemos el array 'data'
          if (response.success && response.data) {
            // Usamos 'as any' por si tenías definido el type Slot de otra forma en este archivo, 
            // pero le pasamos el array de horarios pelado.
            setAvailableSlots(response.data as any);
          } else {
            setAvailableSlots([]);
          }
          setSelectedSlot(null);
          setMessage(null);
        })
        .catch((err) => {
          console.error(err);
          setAvailableSlots([]);
          setSelectedSlot(null);
        });
    }
  }, [selectedCourt, selectedDate]);

  const handleBooking = async () => {
    if (!selectedCourt || !selectedSlot || !userId) {
      setMessage({ text: 'Por favor, completá todos los campos (Cancha, Horario y ID de Usuario).', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    // Precio estático para la demo. Deberías calcularlo según tu lógica de negocio.
    const totalPrice = 15000;

    const result = await createBooking({
      courtId: selectedCourt,
      userId: userId,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      totalPrice: totalPrice, // Zod y el Action lo mapean internamente a totalAmount
    });

    if (result.success) {
      setMessage({ text: '¡Reserva creada con éxito! Redirigiendo al pago...', type: 'success' });
      setSelectedSlot(null);

      // Recargar los turnos para que desaparezca el que acabamos de reservar
      const updatedSlots = await getAvailableSlots(selectedCourt, selectedDate);
      setAvailableSlots(updatedSlots);
    } else {
      setMessage({
        text: typeof result.error === 'string' ? result.error : 'Error al procesar la reserva.',
        type: 'error'
      });
    }

    setLoading(false);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Reservar Turno</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Selección de Cancha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Seleccioná una Cancha
          </label>
          <select
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- Elegir Cancha --</option>
            {courts.map((court) => (
              // Usamos court.sport como corresponde a tu esquema de Prisma
              <option key={court.id} value={court.id}>
                {court.name} ({court.sport})
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Fecha
          </label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Grilla de Horarios */}
      {selectedCourt && selectedDate && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
            Horarios Disponibles
          </label>

          {loading && availableSlots.length === 0 ? (
            <p className="text-slate-500">Buscando turnos...</p>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-600'
                      }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-red-500 font-medium">No hay turnos disponibles para esta fecha.</p>
          )}
        </div>
      )}

      {/* Input de Usuario (Temporal hasta conectar Auth) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Tu ID de Usuario (Requerido por BD)
        </label>
        <input
          type="text"
          placeholder="Ej: d3b07384-d9a..."
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full md:w-1/2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Mensajes de feedback */}
      {message && (
        <div className={`p-4 mb-6 rounded-lg font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Botón de Confirmación */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
        <button
          onClick={handleBooking}
          disabled={!selectedSlot || !selectedCourt || loading || !userId}
          className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
        >
          {loading ? 'Procesando...' : 'Confirmar y Pagar'}
        </button>
      </div>
    </div>
  );
}