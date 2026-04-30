export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import AdminDataTable from '@/components/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function AdminExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' }
  });

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Gastos</h1>
          <p className="text-slate-500 mt-1">Control financiero y egresos del club.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Gasto
        </Button>
      </div>

      <AdminDataTable 
        data={expenses}
        columns={[
          { key: 'date', header: 'Fecha', render: (val) => new Date(String(val)).toLocaleDateString() },
          { key: 'description', header: 'Descripción' },
          { key: 'category', header: 'Categoría' },
          { key: 'amount', header: 'Monto', render: (val) => `$${Number(val).toFixed(2)}` },
        ]}
      />
    </div>
  );
}
