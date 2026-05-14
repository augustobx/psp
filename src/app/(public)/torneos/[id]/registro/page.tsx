'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { registerTeam } from '@/actions/public-tournaments';
import { createTournamentPaymentPreference } from '@/actions/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TournamentRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    categoryId: '', // En la vida real habría un dropdown con las categorías del torneo
    teamName: '',
    player1Name: '',
    player1Phone: '',
    player2Name: '',
    player2Phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Hardcode category for simplicity in Phase 3 demo, 
    // ideally fetched from tournament.categories
    const categoryId = formData.categoryId || 'mock-category-id'; 

    const result = await registerTeam(tournamentId, categoryId, formData);
    
    if (result.success && result.teamId) {
      // Intentar crear la preferencia de pago si aplica
      const payRes = await createTournamentPaymentPreference(result.teamId);
      if (payRes.success && payRes.init_point) {
        window.location.href = payRes.init_point;
        return; // Detener ejecución para que redirija
      }
      setSuccess(true);
    } else {
      setError(result.error || 'Ocurrió un error inesperado');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 max-w-md w-full text-center shadow-xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">¡Inscripción Exitosa!</h1>
          <p className="text-slate-500 mb-8">Tu pareja ha sido pre-inscripta al torneo. Nos contactaremos a la brevedad.</p>
          <Link href={`/torneos/${tournamentId}`}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6">Volver al Torneo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href={`/torneos/${tournamentId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver al Torneo
        </Link>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Formulario de Inscripción</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Datos del Equipo</h2>
              <div className="space-y-2">
                <Label>Nombre de la Pareja (Opcional)</Label>
                <Input 
                  placeholder="Ej: Los Galácticos" 
                  value={formData.teamName} 
                  onChange={e => setFormData({...formData, teamName: e.target.value})} 
                  className="rounded-xl h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Jugador 1</h2>
                <div className="space-y-2">
                  <Label>Nombre y Apellido</Label>
                  <Input required value={formData.player1Name} onChange={e => setFormData({...formData, player1Name: e.target.value})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono de WhatsApp</Label>
                  <Input required type="tel" value={formData.player1Phone} onChange={e => setFormData({...formData, player1Phone: e.target.value})} className="rounded-xl h-12" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Jugador 2</h2>
                <div className="space-y-2">
                  <Label>Nombre y Apellido</Label>
                  <Input required value={formData.player2Name} onChange={e => setFormData({...formData, player2Name: e.target.value})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono de WhatsApp</Label>
                  <Input required type="tel" value={formData.player2Phone} onChange={e => setFormData({...formData, player2Phone: e.target.value})} className="rounded-xl h-12" />
                </div>
              </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl text-lg mt-4 shadow-lg shadow-emerald-500/30">
              {loading ? 'Procesando...' : 'Confirmar Inscripción'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
