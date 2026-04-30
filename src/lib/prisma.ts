import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createPool } from 'mariadb';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// String de conexión directo. Si pusiste otra clave en phpMyAdmin, cambiala acá.
const pool = createPool("mariadb://root:Basq2121@127.0.0.1:3306/pspdb?connectionLimit=10");

const adapter = new PrismaMariaDb(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;