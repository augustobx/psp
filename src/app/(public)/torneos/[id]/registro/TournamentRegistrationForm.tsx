'use client';

import { useState } from 'react';
import { registerTeam } from '@/actions/public-tournaments';
import { createTournamentPaymentPreference } from '@/actions/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type Props = {
  tournamentId: string;
  categories: { id: string; name: string; teamCount: number }[];
  requireDeposit: boolean;
  session: any;
};

export default function TournamentRegistrationForm({ tournamentId, categories, requireDeposit, session }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoryId: categories.length === 1 ? categories[0].id : '',
    teamName: '',
    player1Name: session?.name ? `${session.name} ${session.lastName || ''}`.trim() : '',
    player1Phone: session?.phone || '',
    player2Name: '',
    player2Phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      setError('Seleccioná una categoría');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await registerTeam(tournamentId, formData.categoryId, formData);

    if (result.success && result.teamId) {
      if (requireDeposit) {
        const payRes = await createTournamentPaymentPreference(result.teamId);
        if (payRes.success && payRes.init_point) {
          window.location.href = payRes.init_point;
          return;
        }
      }
      setSuccess(true);
    } else {
      setError(result.error || 'Error al inscribir');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-3">¡Inscripción Exitosa!</h2>
        <p className="text-slate-400 mb-8">Tu pareja fue registrada correctamente. Nos contactaremos a la brevedad.</p>
        <Link href={`/torneos/${tournamentId}`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 px-8">Volver al Torneo</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SELECTOR DE CATEGORÍA */}
      <div className="space-y-2">
        <Label className="text-slate-300">Categoría</Label>
        <select
          value={formData.categoryId}
          onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full h-12 rounded-xl border border-slate-600 bg-slate-700/50 px-4 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          required
        >
          <option value="">Seleccionar categoría...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.teamCount} inscriptos)</option>
          ))}
        </select>
      </div>

      {/* NOMBRE PAREJA */}
      <div className="space-y-2">
        <Label className="text-slate-300">Nombre de la Pareja <span className="text-slate-600">(opcional)</span></Label>
        <Input
          placeholder="Ej: Los Galácticos"
          value={formData.teamName}
          onChange={e => setFormData({ ...formData, teamName: e.target.value })}
          className="rounded-xl h-12 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
        />
      </div>

      {/* JUGADORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-emerald-400 border-b border-slate-700/50 pb-2">Jugador 1</h3>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Nombre y Apellido</Label>
            <Input required value={formData.player1Name} onChange={e => setFormData({ ...formData, player1Name: e.target.value })} className="rounded-xl h-11 bg-slate-700/50 border-slate-600 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Teléfono WhatsApp</Label>
            <Input required type="tel" placeholder="1155667788" value={formData.player1Phone} onChange={e => setFormData({ ...formData, player1Phone: e.target.value })} className="rounded-xl h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-blue-400 border-b border-slate-700/50 pb-2">Jugador 2</h3>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Nombre y Apellido</Label>
            <Input required value={formData.player2Name} onChange={e => setFormData({ ...formData, player2Name: e.target.value })} className="rounded-xl h-11 bg-slate-700/50 border-slate-600 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Teléfono WhatsApp</Label>
            <Input required type="tel" placeholder="1155667788" value={formData.player2Phone} onChange={e => setFormData({ ...formData, player2Phone: e.target.value })} className="rounded-xl h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500" />
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 font-medium text-sm">{error}</div>}

      <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]">
        {loading ? 'Procesando...' : requireDeposit ? 'Inscribirme y Pagar Seña' : 'Confirmar Inscripción'}
      </Button>
    </form>
  );
}
