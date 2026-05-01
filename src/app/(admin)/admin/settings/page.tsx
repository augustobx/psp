'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        getSettings().then(res => {
            if (res.success) setSettings(res.data);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);

        // Convertimos a número los campos que lo requieren
        const payload = {
            ...settings,
            reservationFee: parseFloat(settings.reservationFee) || 0,
            splashDuration: parseInt(settings.splashDuration) || 1500,
            bubbleDuration: parseInt(settings.bubbleDuration) || 3000,
        };

        const result = await updateSettings(payload);

        if (result.success) {
            setMessage({ type: 'success', text: 'Todas las configuraciones se guardaron correctamente.' });
        } else {
            setMessage({ type: 'error', text: 'Error al guardar.' });
        }
        setLoading(false);
    };

    if (!settings) return <div className="p-8 font-bold text-slate-500 animate-pulse">Cargando configuraciones del club...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100">

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Configuración General</h2>
                {message && (
                    <div className={`px-4 py-2 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* BLOQUE 1: NEGOCIO Y MERCADO PAGO (Lo que ya tenías) */}
                <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-black text-lg text-slate-800 flex items-center">🏢 Datos del Club y Pagos</h3>

                    <div className="space-y-3">
                        <Label>Nombre del Club</Label>
                        <Input value={settings.clubName || ''} onChange={e => setSettings({ ...settings, clubName: e.target.value })} placeholder="Ej: San Pedro Padel" className="bg-white" />
                    </div>

                    <div className="space-y-3">
                        <Label>Teléfono / WhatsApp</Label>
                        <Input value={settings.contactPhone || ''} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} placeholder="Ej: +5493329..." className="bg-white" />
                    </div>

                    <div className="space-y-3">
                        <Label>Access Token (Mercado Pago)</Label>
                        <Input type="password" value={settings.mpAccessToken || ''} onChange={e => setSettings({ ...settings, mpAccessToken: e.target.value })} placeholder="APP_USR-..." className="bg-white" />
                    </div>

                    <div className="space-y-3">
                        <Label>Monto de la Seña ($)</Label>
                        <Input type="number" value={settings.reservationFee || ''} onChange={e => setSettings({ ...settings, reservationFee: e.target.value })} placeholder="3000" className="bg-white" />
                    </div>

                    <div className="pt-4 space-y-4 border-t border-slate-200">
                        <div className="flex items-center space-x-3">
                            <input type="checkbox" checked={settings.requireDeposit} onChange={e => setSettings({ ...settings, requireDeposit: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <Label className="font-bold">Exigir pago de seña obligatorio</Label>
                        </div>
                        <div className="flex items-center space-x-3 opacity-70">
                            <input type="checkbox" checked={settings.autoWhatsapp} onChange={e => setSettings({ ...settings, autoWhatsapp: e.target.checked })} className="w-5 h-5 rounded border-slate-300" />
                            <Label>Activar Bot automático de WhatsApp</Label>
                        </div>
                    </div>
                </div>

                {/* BLOQUE 2: DISEÑO DE LA APP PWA */}
                <div className="space-y-6">

                    {/* Splash */}
                    <div className="space-y-4 p-6 border border-slate-200 rounded-2xl bg-emerald-50/50">
                        <h3 className="font-black text-emerald-700 flex items-center">🚀 Pantalla Inicial (Splash)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Texto / Logo</Label>
                                <Input value={settings.splashLogo || ''} onChange={e => setSettings({ ...settings, splashLogo: e.target.value })} className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Duración (ms)</Label>
                                <Input type="number" value={settings.splashDuration || ''} onChange={e => setSettings({ ...settings, splashDuration: e.target.value })} className="bg-white" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label>Color de la App</Label>
                            <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none" value={settings.theme || 'light'} onChange={e => setSettings({ ...settings, theme: e.target.value })}>
                                <option value="light">Fondo Claro ☀️</option>
                                <option value="dark">Fondo Oscuro 🌙</option>
                            </select>
                        </div>
                    </div>

                    {/* Globo Popup */}
                    <div className="space-y-4 p-6 border border-slate-200 rounded-2xl bg-blue-50/50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-blue-700 flex items-center">💬 Globo Flotante</h3>
                            <input type="checkbox" checked={settings.bubbleActive} onChange={e => setSettings({ ...settings, bubbleActive: e.target.checked })} className="w-5 h-5 rounded" />
                        </div>
                        <div className="space-y-2">
                            <Label>Mensaje del globo (Acepta emojis)</Label>
                            <Input value={settings.bubbleText || ''} onChange={e => setSettings({ ...settings, bubbleText: e.target.value })} className="bg-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Color de fondo</Label>
                                <div className="flex space-x-2">
                                    <input type="color" value={settings.bubbleColor || '#10b981'} onChange={e => setSettings({ ...settings, bubbleColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border-0" />
                                    <Input value={settings.bubbleColor || ''} onChange={e => setSettings({ ...settings, bubbleColor: e.target.value })} className="bg-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Duración (ms)</Label>
                                <Input type="number" value={settings.bubbleDuration || ''} onChange={e => setSettings({ ...settings, bubbleDuration: e.target.value })} className="bg-white" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
                <Button onClick={handleSave} disabled={loading} className="w-full py-6 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg transition-all">
                    {loading ? 'Guardando...' : 'Guardar Todas las Configuraciones'}
                </Button>
            </div>
        </div>
    );
}