import { prisma } from '../config/db';

async function fixOrphanRows() {
  console.log('Cleaning up remaining tables with Prisma executeRaw...');
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Lead" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "TenantRegistration" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "WebsitePage" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Website" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Product" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Payment" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Order" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "FileRecord" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Notification" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "AuditLog" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Subscription" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PaymentWebhook" CASCADE;`);
    console.log('All remaining tables dropped.');
  } catch (e: any) {
    console.log('Query info:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanRows();
