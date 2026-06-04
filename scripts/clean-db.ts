import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
    console.log('Iniciando limpieza de la base de datos (manteniendo configuraciones)...');

    try {
        // 1. Limpiar datos transaccionales de Torneos
        console.log('- Borrando datos de Torneos...');
        await prisma.tournamentMatch.deleteMany();
        await prisma.tournamentGroupTeam.deleteMany();
        await prisma.tournamentGroup.deleteMany();
        await prisma.tournamentTeam.deleteMany();
        await prisma.tournamentCategory.deleteMany();
        await prisma.tournament.deleteMany();

        // 2. Limpiar Reservas y Bloqueos
        console.log('- Borrando Reservas y Bloqueos...');
        await prisma.booking.deleteMany();
        await prisma.fixedBooking.deleteMany();
        await prisma.courtBlock.deleteMany();

        // 3. Limpiar Gastos (Expenses)
        console.log('- Borrando Gastos...');
        await prisma.expense.deleteMany();

        // 4. Limpiar Usuarios (Excepto Administradores)
        // Mantener a los administradores ya que suelen ser parte de la configuración base
        console.log('- Borrando Usuarios (manteniendo Administradores)...');
        await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'ADMIN'
                }
            }
        });

        // NOTA: No borramos Courts, BusinessHour, Setting, ni SystemSetting
        // ya que son la configuración estructural del sistema.

        console.log('✅ Limpieza completada exitosamente.');
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDatabase();
