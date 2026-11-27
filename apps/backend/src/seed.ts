import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client.js';
import { syncSystemCategories } from './expense-categories/system-categories.sync.js';

/**
 * Prisma seed: applies the System Category catalog. Safe to run on every
 * deploy (`node dist/seed.js`) and in development (`pnpm db:seed`).
 */
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });

try {
  await syncSystemCategories(prisma);
  console.log('System Categories synced.');
} finally {
  await prisma.$disconnect();
}
