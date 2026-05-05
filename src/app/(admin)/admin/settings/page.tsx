import { prisma } from "@/lib/prisma";
import { updateSystemSettings } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
    let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

    if (!settings) {
        settings = await prisma.systemSetting.create({
            data: { clubName: "PSP Padel", contactPhone: "", reservationFee: 0, mpAccessToken: "", theme: "light" }
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
                                <Input id="clubName" name="clubName" defaultValue={settings.clubName} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Teléfono de Contacto (WhatsApp)</Label>
                                <Input id="contactPhone" name="contactPhone" defaultValue={settings.contactPhone} placeholder="Ej: 5493329..." />
                            </div>
                        </CardContent>
                    </Card>

                    {/* BLOQUE NUEVO: Apariencia y Colores */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Apariencia</CardTitle>
                            <CardDescription>Configuración visual de la web.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="theme">Tema (Color)</Label>
                                <select
                                    id="theme"
                                    name="theme"
                                    defaultValue={settings.theme || 'light'}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                >
                                    <option value="light">Claro (Light)</option>
                                    <option value="dark">Oscuro (Dark)</option>
                                </select>
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
                                <Input id="reservationFee" name="reservationFee" type="number" defaultValue={settings.reservationFee} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mpAccessToken">MercadoPago Access Token</Label>
                                <Input id="mpAccessToken" name="mpAccessToken" type="password" defaultValue={settings.mpAccessToken} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* BLOQUE 3: Funciones del Sistema */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Módulos del Sistema</CardTitle>
                            <CardDescription>Activa o desactiva funcionalidades.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Switch de WhatsApp */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="autoWhatsapp">Notificaciones Meta API</Label>
                                    <p className="text-sm text-gray-500">Enviar confirmaciones automáticas.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="autoWhatsapp" name="autoWhatsapp" value="on" defaultChecked={settings.autoWhatsapp} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Switch de PWA (Ahora sí funciona) */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="pwaEnabled">Habilitar Reservas Web (PWA)</Label>
                                    <p className="text-sm text-gray-500">Si se apaga, redirige a WhatsApp.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="pwaEnabled" name="pwaEnabled" value="on" defaultChecked={settings.pwaEnabled} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="flex justify-end pt-6">
                    <Button type="submit" size="lg" className="w-full md:w-auto">Guardar Cambios</Button>
                </div>
            </form>
        </div>
    );
}