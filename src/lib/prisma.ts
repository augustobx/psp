import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createPool } from 'mariadb';

const connectionString = (process.env.DATABASE_URL || 'mysql://root@localhost:3306/psp').replace(/^mysql:\/\//, 'mariadb://').replace(/root:@/, 'root@');
const pool = createPool(connectionString);
const adapter = new PrismaMariaDb(pool as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
