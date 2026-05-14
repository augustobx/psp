'use client';

import { useState } from 'react';
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
import { registerTeam } from '@/actions/public-tournaments';
import { useRouter } from 'next/navigation';

export default function TournamentTeamsModal({ category }: { category: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    teamName: '',
    player1Name: '',
    player1Phone: '',
    player2Name: '',
    player2Phone: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await registerTeam(category.tournamentId, category.id, formData);
    setFormData({ teamName: '', player1Name: '', player1Phone: '', player2Name: '', player2Phone: '' });
    setLoading(false);
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* @ts-expect-error - asChild type issue */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Ver Inscriptos ({category.teams?.length || 0})</Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inscriptos en {category.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de Inscriptos */}
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Pareja</th>
                  <th className="p-2 text-left">Jugador 1</th>
                  <th className="p-2 text-left">Jugador 2</th>
                  <th className="p-2 text-center">Abonado</th>
                </tr>
              </thead>
              <tbody>
                {category.teams?.map((t: any) => (
                  <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-2 font-medium">{t.name}</td>
                    <td className="p-2">{t.player1?.name || t.phone1}</td>
                    <td className="p-2">{t.player2?.name || t.phone2}</td>
                    <td className="p-2 text-center">{t.isPaid ? '✅' : '❌'}</td>
                  </tr>
                ))}
                {!category.teams?.length && (
                  <tr><td colSpan={4} className="p-4 text-center text-slate-500">No hay inscriptos</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Agregar Manual */}
          <form onSubmit={handleAdd} className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold">Agregar Inscripción Manual</h3>
            
            <div className="space-y-2">
              <Label>Nombre Pareja</Label>
              <Input required value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} placeholder="Ej: Los Padelistas" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Jugador 1</Label>
                <Input required value={formData.player1Name} onChange={e => setFormData({...formData, player1Name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono Jugador 1</Label>
                <Input required value={formData.player1Phone} onChange={e => setFormData({...formData, player1Phone: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre Jugador 2</Label>
                <Input required value={formData.player2Name} onChange={e => setFormData({...formData, player2Name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono Jugador 2</Label>
                <Input required value={formData.player2Phone} onChange={e => setFormData({...formData, player2Phone: e.target.value})} />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Agregando...' : 'Guardar Pareja'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
