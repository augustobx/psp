'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    try {
        // Buscamos la configuración (siempre será el ID 1)
        let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

        // Si no existe, la creamos con los valores por defecto
        if (!settings) {
            settings = await prisma.systemSetting.create({ data: { id: 1 } });
        }

        return { success: true, data: settings };
    } catch (error) {
        return { success: false, error: 'Error al cargar configuraciones' };
    }
}

export async function updateSettings(data: any) {
    try {
        await prisma.systemSetting.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...data },
        });
        revalidatePath('/'); // Recarga la PWA
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al guardar configuraciones' };
    }
}