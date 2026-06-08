'use client';

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User as UserIcon, Edit, ShieldBan, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateUserAdmin } from "@/actions/admin-users";


type UserData = {
    id: string;
    name: string | null;
    lastName: string | null;
    dni: string | null;
    phone: string | null;
    email: string | null;
    category: string | null;
    isActive: boolean;
    createdAt: Date;
    _count: { bookings: number };
};

export default function UsuariosClient({ initialUsers }: { initialUsers: UserData[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        phone: "",
        category: "",
        isActive: true,
        password: ""
    });

    const openEdit = (user: UserData) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            category: user.category || "",
            isActive: user.isActive,
            password: ""
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsLoading(true);

        const res = await updateUserAdmin(selectedUser.id, formData);
        
        if (res.success) {
            alert("Usuario actualizado correctamente");
            setUsers(users.map(u => u.id === selectedUser.id ? { 
                ...u, 
                name: formData.name, 
                lastName: formData.lastName, 
                phone: formData.phone,
                category: formData.category,
                isActive: formData.isActive
            } : u));
            setIsEditing(false);
        } else {
            alert(res.error || "Error al actualizar");
        }
        
        setIsLoading(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-emerald-500" /> 
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
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>DNI</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Reservas</TableHead>
                                    <TableHead>Registro</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                                            Aún no hay usuarios registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                {user.isActive ? 
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Activo</Badge> : 
                                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none"><ShieldBan className="w-3 h-3 mr-1" /> Bloqueado</Badge>
                                                }
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {user.name} {user.lastName}
                                            </TableCell>
                                            <TableCell>{user.dni || '-'}</TableCell>
                                            <TableCell>{user.phone || '-'}</TableCell>
                                            <TableCell>{user.email || '-'}</TableCell>
                                            <TableCell>{user.category || '-'}</TableCell>
                                            <TableCell>{user._count.bookings}</TableCell>
                                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <button onClick={() => openEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Apellido</label>
                                <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Teléfono</label>
                            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-white">
                                <option value="">Sin Categoría</option>
                                <option value="8va">8va</option>
                                <option value="7ma">7ma</option>
                                <option value="6ta">6ta</option>
                                <option value="5ta">5ta</option>
                                <option value="4ta">4ta</option>
                                <option value="3ra">3ra</option>
                                <option value="2da">2da</option>
                                <option value="1ra">1ra</option>
                            </select>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                            <h3 className="font-bold text-sm text-slate-500">Opciones de Seguridad</h3>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nueva Contraseña (Opcional)</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Dejar en blanco para no cambiar" className="w-full px-3 py-2 border rounded-xl" />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                <div>
                                    <p className="font-medium text-sm">Estado de la Cuenta</p>
                                    <p className="text-xs text-slate-500">{formData.isActive ? 'El usuario puede iniciar sesión y reservar.' : 'El usuario está bloqueado.'}</p>
                                </div>
                                <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50">
                                {isLoading ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
