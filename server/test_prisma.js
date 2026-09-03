const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const t = await prisma.tenant.findFirst();
  const res = await prisma.tenant.update({
    where: { id: t.id },
    data: {
      settings: {
        ...(t.settings || {}),
        heroArrivalGuarantee: "TEST GUARANTEE"
      }
    }
  });
  console.log("Updated:", res.settings);
}
run().catch(console.error).finally(() => prisma.$disconnect());
