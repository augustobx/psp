'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCategory, deleteCategory, generateKnockoutBracket } from '@/actions/tournament-engine';
import { updateTournamentStatus } from '@/actions/tournaments';
import TournamentMesaControl from './TournamentMesaControl';
import TournamentTeamsModal from './TournamentTeamsModal';
import TournamentZonesGeneratorModal from './TournamentZonesGeneratorModal';
import { Trash2, Zap, Users } from 'lucide-react';

export default function TournamentManager({ tournament }: { tournament: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    await updateTournamentStatus(tournament.id, newStatus);
    setLoading(false);
    router.refresh();
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    await createCategory(tournament.id, newCatName.trim(), null, tournament.format);
    setNewCatName('');
    setLoading(false);
    router.refresh();
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('¿Eliminar esta categoría y todos sus datos?')) return;
    setLoading(true);
    await deleteCategory(catId);
    setLoading(false);
    router.refresh();
  };

  const handleGenerateBracket = async (categoryId: string) => {
    if (!confirm('¿Generar cuadro? Si ya existe uno, se eliminará y se creará de nuevo.')) return;
    setLoading(true);
    const res = await generateKnockoutBracket(categoryId);
    if (res.success) {
      setFeedback(res.message || 'Cuadro generado correctamente.');
    } else {
      setFeedback(res.error || 'Error al generar cuadro.');
    }
    setLoading(false);
    router.refresh();
  };

  const statusLabels: Record<string, string> = {
    'DRAFT': '📝 Borrador',
    'REGISTRATION': '📋 Inscripciones Abiertas',
    'ONGOING': '🔴 En Curso (Jugando)',
    'COMPLETED': '✅ Finalizado',
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-medium flex justify-between">
          {feedback}
          <button onClick={() => setFeedback(null)} className="text-blue-400 hover:text-blue-600">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CATEGORIAS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Categorías y Cuadros</CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.categories.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No hay categorías. Creá una para empezar.</p>
            ) : (
              <div className="space-y-4">
                {tournament.categories.map((cat: any) => (
                  <div key={cat.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{cat.name}</h3>
                        <Badge variant="outline">{cat.format || tournament.format}</Badge>
                      </div>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {cat.teams?.length || 0} parejas</span>
                      <span>• {cat.matches?.length || 0} partidos</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <TournamentZonesGeneratorModal category={cat} tournamentStartDate={new Date(tournament.startDate)} />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleGenerateBracket(cat.id)}
                        disabled={loading || (cat.teams?.length || 0) < 2}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        {cat.matches?.length ? 'Regenerar Cuadro' : 'Generar Cuadro'}
                      </Button>
                      <TournamentTeamsModal category={cat} tournamentId={tournament.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Agregar nueva categoría</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 5ta Libre, 7ma Masculina, Mixto..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  className="bg-white dark:bg-slate-800"
                />
                <Button onClick={handleCreateCategory} disabled={loading || !newCatName.trim()} className="whitespace-nowrap">
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SIDEBAR: ESTADO + CONFIG */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Torneo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={tournament.status === key ? 'default' : 'outline'}
                    className={
                      tournament.status === key
                        ? key === 'REGISTRATION' ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : key === 'ONGOING' ? 'bg-red-600 hover:bg-red-700 text-white'
                        : ''
                        : ''
                    }
                    onClick={() => handleStatusChange(key)}
                    disabled={loading}
                    size="sm"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Formato</span>
                <span className="font-medium">{tournament.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cupo Máximo</span>
                <span className="font-medium">{tournament.maxTeams || 'Sin límite'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inscripción</span>
                <span className="font-bold">${tournament.entryFee?.toString() || '0'}</span>
              </div>
              {tournament.requireDeposit && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Seña MP</span>
                  <span className="font-bold text-amber-600">${tournament.depositAmount?.toString() || '0'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MESA DE CONTROL */}
      <Card>
        <CardHeader>
          <CardTitle>Mesa de Control — Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentMesaControl tournament={tournament} />
        </CardContent>
      </Card>
    </div>
  );
}
