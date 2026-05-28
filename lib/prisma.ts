import { PrismaClient } from '@prisma/client';

// Soporte de adapters (Prisma 7 requiere adapter para Postgres cuando usa el motor "client")
let PrismaBetterSqlite3: any = null;
let PgAdapter: any = null;
let PgPool: any = null;

let prismaInstance: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
  if (prismaInstance) return prismaInstance;

  const datasourceUrl = process.env.DATABASE_URL?.trim() || 'file:./dev.db';
  const isSQLite = datasourceUrl.startsWith('file:');

  try {
    if (isSQLite) {
      if (!PrismaBetterSqlite3) {
        PrismaBetterSqlite3 = require('@prisma/adapter-better-sqlite3').PrismaBetterSqlite3;
      }
      const adapter = new PrismaBetterSqlite3({ url: datasourceUrl });
      prismaInstance = new PrismaClient({ adapter, log: ['error'] });
    } else {
      // PostgreSQL con adapter oficial (soluciona el error "engine type client" de Prisma 7)
      // Usamos require dinámico para reducir trazas de import en desarrollo
      if (!PgAdapter || !PgPool) {
        // @ts-ignore - dynamic require para evitar trazas excesivas en dev
        const adapterPkg = require('@prisma/adapter-pg');
        // @ts-ignore
        const pg = require('pg');
        PgAdapter = adapterPkg.PrismaPg;
        PgPool = pg.Pool;
      }

      const pool = new PgPool({ connectionString: datasourceUrl });
      const adapter = new PgAdapter(pool);
      prismaInstance = new PrismaClient({ adapter, log: ['error'] });
    }
  } catch (error) {
    console.error('Failed to initialize Prisma:', error);

    // Fallbacks
    if (isSQLite) {
      if (!PrismaBetterSqlite3) {
        PrismaBetterSqlite3 = require('@prisma/adapter-better-sqlite3').PrismaBetterSqlite3;
      }
      const fallbackAdapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
      prismaInstance = new PrismaClient({ adapter: fallbackAdapter, log: ['error'] });
    } else {
      // Último intento sin adapter (puede fallar en Prisma 7)
      prismaInstance = new PrismaClient({ log: ['error'] });
    }
  }

  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});
