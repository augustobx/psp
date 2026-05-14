'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCategory, generateKnockoutBracket } from '@/actions/tournament-engine';
import { updateTournament } from '@/actions/tournaments';
import TournamentMesaControl from './TournamentMesaControl';
import TournamentTeamsModal from './TournamentTeamsModal';

export default function TournamentManager({ tournament }: { tournament: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    await updateTournament(tournament.id, { ...tournament, status: newStatus });
    setLoading(false);
    router.refresh();
  };

  const handleCreateCategory = async () => {
    if (!newCatName) return;
    setLoading(true);
    await createCategory(tournament.id, newCatName, null, tournament.format);
    setNewCatName('');
    setLoading(false);
    router.refresh();
  };

  const handleGenerateBracket = async (categoryId: string) => {
    if (!confirm('¿Seguro que deseas generar el cuadro? Esto creará los partidos.')) return;
    setLoading(true);
    const res = await generateKnockoutBracket(categoryId);
    if (!res.success) alert(res.error);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Categorías y Cuadros</CardTitle>
        </CardHeader>
        <CardContent>
          {tournament.categories.length === 0 ? (
            <p className="text-slate-500 py-4 text-center">No hay categorías configuradas aún.</p>
          ) : (
            <div className="space-y-4">
              {tournament.categories.map((cat: any) => (
                <div key={cat.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{cat.name}</h3>
                    <Badge variant="outline">{cat.format || tournament.format}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleGenerateBracket(cat.id)} disabled={loading}>
                      Generar Cuadro / Zonas
                    </Button>
                    <TournamentTeamsModal category={cat} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-2 items-center">
            <Input 
              placeholder="Nombre de nueva categoría (ej. 5ta Libre)" 
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="bg-white dark:bg-slate-800"
            />
            <Button onClick={handleCreateCategory} disabled={loading || !newCatName} className="whitespace-nowrap">
              Agregar Categoría
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-3 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Mesa de Control (Partidos)</CardTitle>
          </CardHeader>
          <CardContent>
            <TournamentMesaControl tournament={tournament} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Torneo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button 
                variant={tournament.status === 'DRAFT' ? 'default' : 'outline'} 
                onClick={() => handleStatusChange('DRAFT')}
                disabled={loading}
              >
                1. Borrador (DRAFT)
              </Button>
              <Button 
                variant={tournament.status === 'REGISTRATION' ? 'default' : 'outline'} 
                className={tournament.status === 'REGISTRATION' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                onClick={() => handleStatusChange('REGISTRATION')}
                disabled={loading}
              >
                2. Inscripciones Abiertas
              </Button>
              <Button 
                variant={tournament.status === 'ONGOING' ? 'default' : 'outline'} 
                className={tournament.status === 'ONGOING' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                onClick={() => handleStatusChange('ONGOING')}
                disabled={loading}
              >
                3. En Curso (JUGANDO)
              </Button>
              <Button 
                variant={tournament.status === 'COMPLETED' ? 'default' : 'outline'} 
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={loading}
              >
                4. Finalizado
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Formato General</p>
              <p className="font-medium">{tournament.format}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Inscripción</p>
              <p className="font-medium">${tournament.entryFee?.toString() || '0'}</p>
            </div>
            {tournament.requireDeposit && (
              <div>
                <p className="text-sm text-slate-500">Seña Exigida</p>
                <p className="font-medium text-amber-600">${tournament.depositAmount?.toString() || '0'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
