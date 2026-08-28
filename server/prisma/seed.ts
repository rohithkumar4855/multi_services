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

  // 2. Create Super Admin User
  await prisma.user.create({
    data: {
      email: 'admin@servos.in',
      name: 'Super Admin',
      passwordHash: saHash,
      role: 'SUPER_ADMIN'
    }
  });

  const tenantVoltId = 'tenant-voltfix';

  // 3. Tenant Volt Users (Admin, Worker, Customer)
  const voltAdmin = await prisma.user.create({
    data: {
      email: 'owner@voltfix.in',
      name: 'Ravi Kumar',
      passwordHash,
      role: 'TENANT_ADMIN',
      tenantId: tenantVoltId
    }
  });

  const voltTech = await prisma.user.create({
    data: {
      email: 'tech@voltfix.in',
      name: 'Chandra Sekhar',
      passwordHash,
      role: 'WORKER',
      tenantId: tenantVoltId
    }
  });

  const voltCustomer = await prisma.user.create({
    data: {
      email: 'client@voltfix.in',
      name: 'Kalyan Ram',
      passwordHash,
      role: 'CUSTOMER',
      tenantId: tenantVoltId
    }
  });

  // 4. Worker Specs
  const worker = await prisma.worker.create({
    data: {
      userId: voltTech.id,
      tenantId: tenantVoltId,
      skills: ['Wiring', 'Troubleshooting', 'Inverter'],
      availability: 'available',
      aadhaarValid: true,
      panValid: true
    }
  });

  // 5. Services list
  const service = await prisma.service.create({
    data: {
      tenantId: tenantVoltId,
      name: 'Short Circuit Repair',
      category: 'Troubleshooting',
      description: 'Diagnose and fix short circuits, sparking switches.',
      basePrice: 350,
      durationMin: 45,
      isActive: true
    }
  });

  // 6. Booking mock
  await prisma.booking.create({
    data: {
      tenantId: tenantVoltId,
      customerId: voltCustomer.id,
      serviceId: service.id,
      workerId: worker.id,
      status: 'ASSIGNED',
      scheduledDate: '2026-07-20',
      scheduledTime: '10:00 AM',
      priceTotal: 350,
      taxTotal: 63,
      discountTotal: 0,
      netTotal: 413,
      formData: {}
    }
  });

  // 7. Lead mock
  await prisma.lead.create({
    data: {
      tenantId: tenantVoltId,
      name: 'Prasad Babu',
      phone: '9000112233',
      email: 'prasadb@gmail.com',
      serviceInterest: 'Full House Wiring',
      notes: 'Requires site visit for new warehouse electrical plan.',
      status: 'contacted'
    }
  });

  console.log('✅ PostgreSQL database seeded successfully with mock accounts!');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

