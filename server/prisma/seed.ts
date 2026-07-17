import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('business123', 10);
  const saHash = await bcrypt.hash('admin123', 10);

  // 1. Clean existing records
  await prisma.booking.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 2. Create Super Admin User
  await prisma.user.create({
    data: {
      email: 'admin@servos.in',
      name: 'Super Admin',
      passwordHash: saHash,
      role: 'SUPER_ADMIN'
    }
  });

  // 3. Create Tenant VoltFix (Electrician)
  const tenantVolt = await prisma.tenant.create({
    data: {
      name: 'VoltFix Nellore',
      subdomain: 'voltfix',
      plan: 'starter',
      config: {
        primaryColor: '#2563eb',
        secondaryColor: '#2563eb',
        logoText: '⚡ VoltFix Pro',
        heroTitle: 'Certified Electrical Services in Nellore',
        heroSubtitle: 'Licensed electricians for home wiring, repairs, and inverter upgrades.',
        whatsAppNumber: '919876543210',
        email: 'contact@voltfix.in',
        phone: '+91 98765 43210',
        businessHours: '08:00 AM – 08:00 PM',
        city: 'Nellore, AP',
        address: '14, Balaji Nagar, Nellore',
        announcementActive: false,
        announcementText: '🎉 Welcome to our brand new site!',
        testimonials: [],
        faqs: []
      }
    }
  });

  // 4. Tenant Volt Users (Admin, Worker, Customer)
  const voltAdmin = await prisma.user.create({
    data: {
      email: 'owner@voltfix.in',
      name: 'Ravi Kumar',
      passwordHash,
      role: 'TENANT_ADMIN',
      tenantId: tenantVolt.id
    }
  });

  const voltTech = await prisma.user.create({
    data: {
      email: 'tech@voltfix.in',
      name: 'Chandra Sekhar',
      passwordHash,
      role: 'WORKER',
      tenantId: tenantVolt.id
    }
  });

  const voltCustomer = await prisma.user.create({
    data: {
      email: 'client@voltfix.in',
      name: 'Kalyan Ram',
      passwordHash,
      role: 'CUSTOMER',
      tenantId: tenantVolt.id
    }
  });

  // 5. Worker Specs
  const worker = await prisma.worker.create({
    data: {
      userId: voltTech.id,
      tenantId: tenantVolt.id,
      skills: ['Wiring', 'Troubleshooting', 'Inverter'],
      availability: 'available',
      aadhaarValid: true,
      panValid: true
    }
  });

  // 6. Services list
  const service = await prisma.service.create({
    data: {
      tenantId: tenantVolt.id,
      name: 'Short Circuit Repair',
      category: 'Troubleshooting',
      description: 'Diagnose and fix short circuits, sparking switches.',
      basePrice: 350,
      durationMin: 45,
      isActive: true
    }
  });

  // 7. Booking mock
  await prisma.booking.create({
    data: {
      tenantId: tenantVolt.id,
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
