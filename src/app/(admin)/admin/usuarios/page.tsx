import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User } from "lucide-react";

export default async function AdminUsuariosPage() {
    const users = await prisma.user.findMany({
        where: { role: "PLAYER" },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { bookings: true }
            }
        }
    });

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Usuarios Registrados</h1>
                <p className="text-gray-500">Gestión de jugadores de la comunidad PSP.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-500" /> 
                        Lista de Jugadores
                    </CardTitle>
                    <CardDescription>
                        Total de registrados: {users.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>DNI</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Reservas</TableHead>
                                    <TableHead>Registro</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                            Aún no hay usuarios registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.name} {user.lastName}
                                            </TableCell>
                                            <TableCell>{user.dni || '-'}</TableCell>
                                            <TableCell>{user.phone || '-'}</TableCell>
                                            <TableCell>{user.email || '-'}</TableCell>
                                            <TableCell>{user.category || '-'}</TableCell>
                                            <TableCell>{user._count.bookings}</TableCell>
                                            <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
