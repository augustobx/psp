import { PrismaClient } from '@prisma/client';

// Evitamos que Next.js instancie múltiples clientes en desarrollo debido al Hot Reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;