const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dump() {
  const users = await prisma.user.findMany();
  const tenants = await prisma.tenant.findMany({
    include: {
      paymentGateways: true,
      websites: true,
      services: true,
      products: true,
      invoices: true,
      payments: true,
      orders: true,
      bookings: true
    }
  });

  console.log(JSON.stringify({ users, tenants }, null, 2));
}

dump()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
