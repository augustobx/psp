import { getCourts } from "@/actions/courts";
import { CourtFormModal } from "@/components/CourtFormModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin } from "lucide-react";

export default async function CourtsPage() {
  const { data: courts, success } = await getCourts();

  if (!success || !courts) {
    return <div className="p-6 text-red-500">Error cargando las canchas.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canchas</h1>
          <p className="text-muted-foreground">Gestioná tus canchas y horarios de atención.</p>
        </div>
        <CourtFormModal /> {/* Botón para crear nueva cancha */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Canchas Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Horarios (Días activos)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No hay canchas registradas.
                  </TableCell>
                </TableRow>
              )}
              {courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell>{court.sport}</TableCell>
                  <TableCell>
                    {court.businessHours.length} días configurados
                  </TableCell>
                  <TableCell>
                    <Badge variant={court.isActive ? "default" : "destructive"}>
                      {court.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CourtFormModal court={court} /> {/* Botón para editar */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}