import prisma from "@/lib/prisma";
import { updateSystemSettings } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
    // Obtenemos la configuración actual, si no existe la creamos por defecto
    let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

    if (!settings) {
        settings = await prisma.systemSetting.create({
            data: { clubName: "PSP Padel", contactPhone: "", reservationFee: 0, mpAccessToken: "" }
        });
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-gray-500">Administra las preferencias generales del complejo y notificaciones.</p>
            </div>

            <form action={updateSystemSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* BLOQUE 1: Información General */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>Datos básicos del complejo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="clubName">Nombre del Complejo</Label>
                                <Input
                                    id="clubName"
                                    name="clubName"
                                    defaultValue={settings.clubName}
                                    placeholder="Ej: PSP Padel"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                                <Input
                                    id="contactPhone"
                                    name="contactPhone"
                                    defaultValue={settings.contactPhone}
                                    placeholder="Ej: +54 9 3329..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* BLOQUE 2: Reservas y Pagos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reservas y Pagos</CardTitle>
                            <CardDescription>MercadoPago y señas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reservationFee">Costo de la Seña ($)</Label>
                                <Input
                                    id="reservationFee"
                                    name="reservationFee"
                                    type="number"
                                    defaultValue={settings.reservationFee}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mpAccessToken">MercadoPago Access Token</Label>
                                <Input
                                    id="mpAccessToken"
                                    name="mpAccessToken"
                                    type="password"
                                    defaultValue={settings.mpAccessToken}
                                    placeholder="APP_USR-..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* BLOQUE 3: Integración WhatsApp (Simplificada) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Módulo WhatsApp</CardTitle>
                            <CardDescription>La API de Meta tomará el nombre del complejo de esta configuración.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                                <div className="space-y-0.5">
                                    <Label htmlFor="autoWhatsapp" className="text-base font-medium">Activar Notificaciones de Meta</Label>
                                    <p className="text-sm text-gray-500">Enviar confirmaciones y recordatorios por WhatsApp automáticamente.</p>
                                </div>
                                {/* Switch nativo simplificado */}
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="autoWhatsapp"
                                        name="autoWhatsapp"
                                        defaultChecked={settings.autoWhatsapp}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BLOQUE 4: Funciones Adicionales (PWA / Burbuja) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Funciones del Sistema</CardTitle>
                            <CardDescription>Activa o desactiva módulos de la web.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="pwaEnabled">Modo App (PWA)</Label>
                                    <p className="text-sm text-gray-500">Permite instalar la web en el celular.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="pwaEnabled" name="pwaEnabled" defaultChecked={settings.pwaEnabled} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="flex justify-end pt-6">
                    <Button type="submit" size="lg" className="w-full md:w-auto">
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </div>
    );
}