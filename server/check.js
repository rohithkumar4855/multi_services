const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findMany().then(t => {
  console.log(JSON.stringify(t[0].settings, null, 2));
}).catch(console.error).finally(() => prisma.$disconnect());
