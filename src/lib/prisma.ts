import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Aseguramos que el protocolo sea el correcto para el adapter sin tocar el .env original
const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');

// El adapter recibe el string de conexión directo, no usamos createPool
const adapter = new PrismaMariaDb(connectionString);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;