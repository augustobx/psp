'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from '@/actions/settings';

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        clubName: initialSettings?.clubName || '',
        contactPhone: initialSettings?.contactPhone || '',
        mpAccessToken: initialSettings?.mpAccessToken || '',
        reservationFee: initialSettings?.reservationFee || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const result = await updateSettings(formData);

        if (result.success) {
            setMessage({ type: 'success', text: 'Configuraciones guardadas correctamente.' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al guardar.' });
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="clubName">Nombre del Club</Label>
                    <Input
                        id="clubName"
                        value={formData.clubName}
                        onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                        placeholder="Ej: San Pedro Padel"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contactPhone">Teléfono de Contacto (WhatsApp)</Label>
                    <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="Ej: +5491123456789"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reservationFee">Monto de la Seña ($)</Label>
                    <Input
                        id="reservationFee"
                        type="number"
                        value={formData.reservationFee}
                        onChange={(e) => setFormData({ ...formData, reservationFee: e.target.value })}
                        placeholder="Ej: 3000"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mpAccessToken">Access Token Mercado Pago</Label>
                    <Input
                        id="mpAccessToken"
                        type="password"
                        value={formData.mpAccessToken}
                        onChange={(e) => setFormData({ ...formData, mpAccessToken: e.target.value })}
                        placeholder="APP_USR-..."
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex justify-end pt-4 border-t dark:border-slate-800">
                <Button type="submit" disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
                    {loading ? 'Guardando...' : 'Guardar Configuraciones'}
                </Button>
            </div>
        </form>
    );
}