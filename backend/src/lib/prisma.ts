import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client with optimized connection pooling
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Optimized for serverless environments (Railway + Neon) with connection pooling
    datasources: {
      db: {
        url: (() => {
          let url = process.env.DATABASE_URL;
          if (!url) {
            throw new Error('DATABASE_URL is not set');
          }
          // Append pgbouncer=true for Neon pooling if not already present
          if (!url.includes('pgbouncer=true')) {
            url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
          }
          // Optional: Add connection_limit and pool_timeout for better control
          if (!url.includes('connection_limit')) {
            url += url.includes('?') ? '&connection_limit=20' : '?connection_limit=20';
          }
          if (!url.includes('pool_timeout')) {
            url += url.includes('?') ? '&pool_timeout=10' : '&pool_timeout=10';
          }
          return url;
        })(),
      },
    },
  });

// Graceful shutdown - disconnect on process termination
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
