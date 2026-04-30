'use client';

import { useState } from 'react';
import { Edit, Plus } from 'lucide-react';
import { Court } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Importá tu action real si se llama distinto
// import { createCourt, updateCourt } from '@/actions/courts';

interface CourtFormModalProps {
  court?: Court;
}

export default function CourtFormModal({ court }: CourtFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: court?.name || '',
    sport: court?.sport || 'Padel',
    isActive: court ? court.isActive : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Acá va tu lógica de guardado:
      // await (court ? updateCourt(court.id, formData) : createCourt(formData));
      console.log('Guardando...', formData);
      setIsOpen(false);
    } catch (error) {
      console.error("Error guardando la cancha:", error);
    } finally {
      setLoading(false);
    }
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
            <Plus className="mr-2 h-4 w-4" /> Agregar Cancha
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{court ? 'Editar Cancha' : 'Nueva Cancha'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Cancha 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sport">Deporte</Label>
            <Input
              id="sport"
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              placeholder="Ej: Padel"
              required
            />
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isActive">Cancha Activa</Label>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t dark:border-slate-700">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}