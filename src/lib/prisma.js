import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configure connection pool
  connection: {
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 