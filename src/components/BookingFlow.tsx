'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle2 } from 'lucide-react';
import BookingCalendar from './BookingCalendar';
import { createBooking } from '@/actions/bookings';

type Court = { id: string; name: string; type: string };
type Slot = { start: string; end: string };

export default function BookingFlow({ courts }: { courts: Court[] }) {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mismos slots de demostración por ahora, en producción se cargarían dinámicamente según selectedCourt y fecha
  const demoSlots = [
    { start: '2026-05-01T10:00:00Z', end: '2026-05-01T11:00:00Z' },
    { start: '2026-05-01T11:00:00Z', end: '2026-05-01T12:00:00Z' },
    { start: '2026-05-01T15:00:00Z', end: '2026-05-01T16:00:00Z' },
  ];

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
    setSuccess(false);
    setError(null);
  };

  const handleConfirmBooking = () => {
    if (!selectedCourt || !selectedSlot) return;

    startTransition(async () => {
      // Usamos un userId de prueba genérico para la demostración
      const testUserId = '00000000-0000-0000-0000-000000000000';
      
      const data = {
        userId: testUserId,
        courtId: selectedCourt.id,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        totalPrice: 15000, // Precio fijo de prueba
      };

      const result = await createBooking(data);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(typeof result.error === 'string' ? result.error : 'Ocurrió un error al reservar.');
      }
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. Selecciona la Cancha</h2>
        <div className="grid gap-4">
          {courts.length === 0 ? (
            <p className="text-slate-500">No hay canchas disponibles.</p>
          ) : (
            courts.map(c => {
              const isSelected = selectedCourt?.id === c.id;
              return (
                <Card 
                  key={c.id} 
                  className={`cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500' : 'hover:border-blue-400'}`}
                  onClick={() => { setSelectedCourt(c); setSelectedSlot(null); }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Tipo: {c.type}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2. Elige el Horario</h2>
        {!selectedCourt ? (
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-slate-500 text-center">Selecciona una cancha primero<br/>para ver los horarios disponibles.</p>
          </div>
        ) : (
          <BookingCalendar 
            availableSlots={demoSlots} 
            onSelectSlot={handleSelectSlot} 
          />
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Revisa los detalles de tu turno antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-semibold">¡Reserva Confirmada!</h3>
              <p className="text-slate-500 text-center">Te esperamos el {new Date(selectedSlot?.start || '').toLocaleDateString()} a las {new Date(selectedSlot?.start || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs.</p>
              <Button className="mt-4 w-full" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cancha:</span>
                  <span className="font-semibold">{selectedCourt?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha:</span>
                  <span className="font-semibold">{selectedSlot && new Date(selectedSlot.start).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Horario:</span>
                  <span className="font-semibold">
                    {selectedSlot && new Date(selectedSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {selectedSlot && new Date(selectedSlot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <span className="text-slate-500 font-medium">Total a pagar en club:</span>
                  <span className="font-bold text-lg">$15,000</span>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmBooking} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Turno
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
