import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TournamentDetailPage({ params }: { params: { id: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      categories: true,
    }
  });

  if (!tournament) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Torneo no encontrado</h1>
        <Link href="/admin/torneos" className="text-blue-500 hover:underline mt-4 inline-block">Volver a Torneos</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/torneos" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{tournament.name}</h1>
        <Badge variant={tournament.isPublished ? "default" : "secondary"} className={tournament.isPublished ? "bg-green-500 text-white ml-auto" : "ml-auto"}>
          {tournament.isPublished ? "Publicado" : "Oculto"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Categorías del Torneo</CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.categories.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No hay categorías configuradas aún.</p>
            ) : (
              <ul className="space-y-2">
                {tournament.categories.map(cat => (
                  <li key={cat.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="outline">{cat.format || tournament.format}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <button className="text-sm font-medium text-blue-600 hover:underline">+ Agregar Categoría (Próximamente)</button>
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
              <p className="text-sm text-slate-500">Cupo Máximo</p>
              <p className="font-medium">{tournament.maxTeams || 'Sin límite'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Inscripción</p>
              <p className="font-medium">${tournament.entryFee.toString()}</p>
            </div>
            {tournament.requireDeposit && (
              <div>
                <p className="text-sm text-slate-500">Seña MP Exigida</p>
                <p className="font-medium text-amber-600">${tournament.depositAmount.toString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
