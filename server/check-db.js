const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findFirst().then(t => {
  console.log('Settings:', t.settings);
}).finally(() => prisma.$disconnect());
