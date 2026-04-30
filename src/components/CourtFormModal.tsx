"use client";

import { useState, useTransition } from "react";
import { upsertCourt, upsertBusinessHours } from "@/actions/courts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus } from "lucide-react";
// Asumiendo que tenés un Switch o Checkbox en shadcn, uso un checkbox nativo estilizado para simplificar la dependencia
import { BusinessHourInput, CourtInput } from "@/lib/schemas";

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function CourtFormModal({ court }: { court?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [name, setName] = useState(court?.name || "");
  const [sport, setSport] = useState(court?.sport || "Padel");
  const [isActive, setIsActive] = useState(court?.isActive ?? true);

  // Estado de horarios (inicializado con los existentes o valores por defecto)
  const [hours, setHours] = useState<BusinessHourInput[]>(
    DAYS_OF_WEEK.map((_, index) => {
      const existing = court?.businessHours?.find((h: any) => h.dayOfWeek === index);
      return {
        courtId: court?.id || "",
        dayOfWeek: index,
        openTime: existing?.openTime || "08:00",
        closeTime: existing?.closeTime || "23:00",
        slotDuration: existing?.slotDuration || 90,
        _active: !!existing // UI flag para saber si el día se trabaja
      };
    })
  );

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      // 1. Guardar/Actualizar Cancha
      const courtData: CourtInput = { name, sport, isActive };
      const courtRes = await upsertCourt(court?.id || null, courtData);

      if (!courtRes.success || !courtRes.data) {
        setError(courtRes.error || "Error al guardar la cancha");
        return;
      }

      // 2. Filtrar días activos y guardar Horarios
      const activeHours = hours
        .filter((h: any) => h._active)
        .map(({ _active, courtId, ...rest }: any) => ({
          ...rest,
          courtId: courtRes.data.id, // Usamos el ID generado o existente
        }));

      if (activeHours.length > 0) {
        const hoursRes = await upsertBusinessHours(courtRes.data.id, activeHours);
        if (!hoursRes.success) {
          setError(hoursRes.error || "Error al guardar los horarios");
          return;
        }
      }

      setIsOpen(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* @ts-expect-error - asChild evita que el menú se rompa */}
      <DialogTrigger asChild>
        {court ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Agregar Cancha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{court ? "Editar Cancha" : "Nueva Cancha"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Cancha 1 (Cristal)" />
            </div>
            <div className="space-y-2">
              <Label>Deporte</Label>
              <Input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Ej. Padel" />
            </div>
            <div className="flex items-center space-x-2 col-span-2 mt-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <Label>Cancha Activa (Disponible para reservas)</Label>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-lg">Horarios de Atención</h3>
            {hours.map((h: any, i) => (
              <div key={i} className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg">
                <div className="w-32 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h._active}
                    onChange={(e) => {
                      const newHours = [...hours];
                      newHours[i]._active = e.target.checked;
                      setHours(newHours);
                    }}
                    className="w-4 h-4"
                  />
                  <Label>{DAYS_OF_WEEK[i]}</Label>
                </div>

                <div className="flex-1 flex gap-2 items-center">
                  <Input
                    type="time"
                    value={h.openTime}
                    disabled={!h._active}
                    onChange={(e) => {
                      const newHours = [...hours];
                      newHours[i].openTime = e.target.value;
                      setHours(newHours);
                    }}
                  />
                  <span>a</span>
                  <Input
                    type="time"
                    value={h.closeTime}
                    disabled={!h._active}
                    onChange={(e) => {
                      const newHours = [...hours];
                      newHours[i].closeTime = e.target.value;
                      setHours(newHours);
                    }}
                  />
                </div>

                <div className="w-32 flex items-center gap-2">
                  <Input
                    type="number"
                    value={h.slotDuration}
                    disabled={!h._active}
                    onChange={(e) => {
                      const newHours = [...hours];
                      newHours[i].slotDuration = parseInt(e.target.value);
                      setHours(newHours);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Cancha y Horarios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}