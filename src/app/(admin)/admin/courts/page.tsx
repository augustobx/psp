export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import AdminDataTable from '@/components/AdminDataTable';
import CourtFormModal from '@/components/CourtFormModal';

export default async function AdminCourtsPage() {
  const courts = await prisma.court.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Canchas</h1>
          <p className="text-slate-500 mt-1">Administra las canchas disponibles en el sistema.</p>
        </div>
        <CourtFormModal />
      </div>

      <AdminDataTable 
        data={courts}
        columns={[
          { key: 'name', header: 'Nombre' },
          { key: 'type', header: 'Tipo' },
          { key: 'status', header: 'Estado', render: (val) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {String(val)}
            </span>
          )},
        ]}
      />
    </div>
  );
}
