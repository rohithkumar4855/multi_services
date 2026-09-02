import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('business123', 10);
  const saHash = await bcrypt.hash('admin123', 10);

  // 1. Clean existing records
  await prisma.lead.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.websitePage.deleteMany({});
  await prisma.website.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.tenantRegistration.deleteMany({});

  // 2. Create Super Admin User
  await prisma.user.create({
    data: {
      email: 'admin@servos.in',
      name: 'Super Admin',
      passwordHash: saHash,
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ PostgreSQL database seeded successfully with super admin user!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
