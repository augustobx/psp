import { getDashboardStats, getTodaySnapshot } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DollarSign, Trophy, MapPin } from "lucide-react";

export default async function AdminDashboard() {
  const [statsRes, snapshotRes] = await Promise.all([
    getDashboardStats(),
    getTodaySnapshot()
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data : {
    todayBookings: 0, activeCourts: 0, pendingRevenue: 0, activeTournaments: 0
  };

  const todayBookings = snapshotRes.success && snapshotRes.data ? snapshotRes.data : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Panel de Control</h1>

      {/* Quick Counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas de Hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Canchas Activas</CardTitle>
            <MapPin className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(stats.pendingRevenue).toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Torneos Activos</CardTitle>
            <Trophy className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTournaments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horario</TableHead>
                <TableHead>Cancha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} -
                    {booking.endTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{booking.court.name}</TableCell>
                  <TableCell>{booking.user?.name || booking.user?.email || booking.description || 'Cliente Local'}</TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {todayBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                    No hay reservas programadas para hoy.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}