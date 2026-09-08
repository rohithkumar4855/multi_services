const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking existing values in Order and Payment...');
  const orderStatuses = await prisma.$queryRawUnsafe(`SELECT DISTINCT "paymentStatus" FROM "Order"`);
  console.log('Order paymentStatuses:', orderStatuses);
  const paymentStatuses = await prisma.$queryRawUnsafe(`SELECT DISTINCT "status" FROM "Payment"`);
  console.log('Payment statuses:', paymentStatuses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
