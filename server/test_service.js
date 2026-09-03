const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TenantService = require('./src/services/tenant.service').default;

async function run() {
  const t = await prisma.tenant.findFirst();
  const mockReqBody = {
    name: "NEW NAME",
    config: {
      heroArrivalGuarantee: "GUARANTEE FROM SCRIPT",
      heroTitle: "NEW TITLE",
      someRandomField: "RANDOM"
    }
  };
  
  console.log("Calling updateTenantConfig...");
  const updated = await TenantService.updateTenantConfig(t.id, mockReqBody);
  console.log("Updated config in DB:", updated.settings);
}

run().catch(console.error).finally(() => prisma.$disconnect());
