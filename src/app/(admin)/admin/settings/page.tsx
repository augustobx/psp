import { prisma } from "@/lib/prisma";
import { updateSystemSettings } from "@/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
    let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

    if (!settings) {
        // Valores por defecto si no hay nada en la BD
        settings = await prisma.systemSetting.create({
            data: {
                clubName: "PSP Padel", contactPhone: "", reservationFee: 0, mpAccessToken: "",
                theme: "light", splashLogo: "", splashName: "", splashDuration: 3000,
                bubbleActive: false, bubbleText: "", pwaEnabled: true,
                reservationsEnabled: true, whatsappReservations: true, autoWhatsapp: false
            }
        });
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="text-gray-500">Administra las preferencias generales, reservas y PWA.</p>
            </div>

            <form action={updateSystemSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* GENERAL Y APARIENCIA */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información General</CardTitle>
                                <CardDescription>Datos básicos y visuales.</CardDescription>
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
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Tema (Color)</Label>
                                    <select id="theme" name="theme" defaultValue={settings.theme || 'light'} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                                        <option value="light">Claro (Light)</option>
                                        <option value="dark">Oscuro (Dark)</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ESTADO DEL SISTEMA DE RESERVAS */}
                        <Card className="border-red-200">
                            <CardHeader className="bg-red-50/50 rounded-t-lg">
                                <CardTitle>Estado de las Reservas</CardTitle>
                                <CardDescription>Control general de la web y WhatsApp.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="reservationsEnabled">Activar Reservas Web</Label>
                                        <p className="text-xs text-gray-500">Si se apaga, pausará la grilla web de turnos.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="reservationsEnabled" name="reservationsEnabled" defaultChecked={settings.reservationsEnabled} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <Label htmlFor="whatsappReservations">Permitir Reservas por WhatsApp</Label>
                                        <p className="text-xs text-gray-500">Muestra el botón de WhatsApp a los clientes.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="whatsappReservations" name="whatsappReservations" defaultChecked={settings.whatsappReservations} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PAGOS, NOTIFICACIONES Y BURBUJA */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pagos y API de Meta</CardTitle>
                                <CardDescription>MercadoPago y Notificaciones automáticas.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reservationFee">Costo Seña ($)</Label>
                                        <Input id="reservationFee" name="reservationFee" type="number" defaultValue={settings.reservationFee} required />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <div className="flex items-center justify-between p-2 border rounded-lg h-10">
                                            <Label htmlFor="autoWhatsapp" className="text-sm">API Meta</Label>
                                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                                <input type="checkbox" id="autoWhatsapp" name="autoWhatsapp" defaultChecked={settings.autoWhatsapp} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mpAccessToken">MercadoPago Access Token</Label>
                                    <Input id="mpAccessToken" name="mpAccessToken" type="password" defaultValue={settings.mpAccessToken} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Burbuja de Mensaje Flotante</CardTitle>
                                <CardDescription>Aviso o información importante para los clientes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <Label htmlFor="bubbleActive">Activar Burbuja</Label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="bubbleActive" name="bubbleActive" defaultChecked={settings.bubbleActive} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bubbleText">Mensaje a mostrar</Label>
                                    <Input id="bubbleText" name="bubbleText" defaultValue={settings.bubbleText || ''} placeholder="Ej: ¡Hoy torneo 6ta categoría!" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* PWA Y SPLASH SCREEN */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>PWA & Splash Screen</CardTitle>
                            <CardDescription>Configuración de la aplicación y pantalla de carga inicial.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                                <div>
                                    <Label htmlFor="pwaEnabled" className="text-base font-medium">Activar funciones PWA</Label>
                                    <p className="text-sm text-gray-500">Habilita el comportamiento de aplicación web instalable.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="pwaEnabled" name="pwaEnabled" defaultChecked={settings.pwaEnabled} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="splashName">Nombre en Splash</Label>
                                    <Input id="splashName" name="splashName" defaultValue={settings.splashName || ''} placeholder="Ej: PSP Padel" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="splashLogo">URL Logo Splash</Label>
                                    <Input id="splashLogo" name="splashLogo" defaultValue={settings.splashLogo || ''} placeholder="/logo.png" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="splashDuration">Duración (ms)</Label>
                                    <Input id="splashDuration" name="splashDuration" type="number" defaultValue={settings.splashDuration || 3000} />
                                </div>
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