import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Aseguramos que el protocolo sea el correcto para el adapter sin tocar el .env original
const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');

// Parsear la URL de conexión para extraer los componentes y agregar opciones de pool
// DonWeb (hosting compartido) cierra conexiones idle agresivamente (~60-300s wait_timeout)
function buildPoolConfig() {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.replace('/', ''),

      // === RESILIENCIA PARA HOSTING COMPARTIDO ===
      connectionLimit: 5,        // Menos conexiones para no exceder el límite del hosting
      acquireTimeout: 10000,     // 10s máximo para obtener una conexión del pool
      idleTimeout: 30,           // Liberar conexiones idle cada 30s (antes que DonWeb las mate)
      minimumIdle: 0,            // No mantener conexiones idle innecesarias
      minDelayValidation: 500,   // Validar la conexión si fue usada hace más de 500ms
      resetAfterUse: true,       // Reset de la conexión al devolverla al pool
    };
  } catch {
    // Fallback: si no se puede parsear, devolver el string original
    return connectionString;
  }
}

// El adapter recibe el PoolConfig con opciones de resiliencia
const adapter = new PrismaMariaDb(buildPoolConfig());

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;