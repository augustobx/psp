'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    try {
        const settings = await prisma.setting.findMany();
        // Convertimos el array en un objeto clave-valor para que sea fácil de usar
        return settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    } catch (error) {
        return {};
    }
}

export async function updateSettings(data: Record<string, string>) {
    try {
        const operations = Object.entries(data).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            })
        );
        await prisma.$transaction(operations);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al actualizar configuraciones' };
    }
}