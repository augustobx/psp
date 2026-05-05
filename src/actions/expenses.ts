'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function getExpenses(monthDate?: Date) {
    try {
        const targetDate = monthDate || new Date();

        const expenses = await prisma.expense.findMany({
            where: {
                date: {
                    gte: startOfMonth(targetDate),
                    lte: endOfMonth(targetDate),
                }
            },
            orderBy: { date: 'desc' }
        });

        const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        return { success: true, data: { expenses, totalAmount } };
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return { success: false, error: 'Error al cargar los gastos.' };
    }
}

export async function createExpense(data: { description: string; amount: number; category: string; dateStr: string }) {
    try {
        // Si la fecha viene vacía, usamos hoy
        const expenseDate = data.dateStr ? new Date(`${data.dateStr}T12:00:00`) : new Date();

        await prisma.expense.create({
            data: {
                description: data.description,
                amount: data.amount,
                category: data.category,
                date: expenseDate,
            }
        });

        revalidatePath('/admin/expenses');
        return { success: true };
    } catch (error) {
        console.error('Error creating expense:', error);
        return { success: false, error: 'Error al registrar el gasto.' };
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({ where: { id } });
        revalidatePath('/admin/expenses');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al eliminar el gasto.' };
    }
}