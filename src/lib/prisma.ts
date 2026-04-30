import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createPool } from 'mariadb';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Usamos la URL del .env. En Linux el driver mariadb no tiene el bug de Windows.
const connectionString = process.env.DATABASE_URL as string;
const pool = createPool(connectionString);
const adapter = new PrismaMariaDb(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;