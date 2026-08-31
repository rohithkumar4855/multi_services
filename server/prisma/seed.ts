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

  // 3. Create Tenant Registrations
  const voltProTenant = await prisma.tenantRegistration.create({
    data: {
      id: 'tenant-voltpro',
      businessName: 'VoltPro Electricals',
      ownerName: 'Ravi Teja',
      ownerPhone: '9876543210',
      ownerEmail: 'ravi@voltpro.in',
      passwordHash,
      industryType: 'Electrician',
      industries: ['Electrician', 'Solar'],
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8',
      font: 'Inter, sans-serif',
      plan: 'professional',
      status: 'active',
      gstNumber: '37AAAAA0000A1Z5',
      config: {
        logoText: '⚡ VoltPro Electricals',
        heroTitle: 'Certified Electrical Engineers at Your Doorstep',
        heroSubtitle: 'From circuit repairs to solar rooftop setups — fast, safe, guaranteed 30-day warranty across the city.',
        city: 'Hyderabad, TS',
        phone: '+91 98765 43210',
        whatsAppNumber: '919876543210',
        email: 'ravi@voltpro.in',
        address: 'Plot 42, Hitech City Main Rd, Hyderabad',
        businessHours: '08:00 AM – 09:00 PM',
        theme: 'modern',
        primaryColor: '#2563eb',
        secondaryColor: '#1d4ed8',
        themeFont: 'Inter, sans-serif'
      }
    }
  });

  const coolFlowTenant = await prisma.tenantRegistration.create({
    data: {
      id: 'tenant-coolflow',
      businessName: 'CoolFlow AC & Refrigeration',
      ownerName: 'Suresh Raina',
      ownerPhone: '9876543211',
      ownerEmail: 'suresh@coolflow.in',
      passwordHash,
      industryType: 'AC Service',
      industries: ['AC Service', 'Appliance Repair'],
      primaryColor: '#06b6d4',
      secondaryColor: '#0891b2',
      font: 'Inter, sans-serif',
      plan: 'professional',
      status: 'active',
      gstNumber: '36AAAAA0000A1Z6',
      config: {
        logoText: '❄️ CoolFlow AC Services',
        heroTitle: 'Rapid Cooling & AC Repair in 90 Minutes',
        heroSubtitle: 'Expert AC gas refill, deep cleaning, installation and compressor overhaul with genuine parts.',
        city: 'Nellore, AP',
        phone: '+91 98765 43211',
        whatsAppNumber: '919876543211',
        email: 'suresh@coolflow.in',
        address: '14/22 Trunk Road, Nellore, AP',
        businessHours: '07:30 AM – 09:30 PM',
        theme: 'medical',
        primaryColor: '#06b6d4',
        secondaryColor: '#0891b2',
        themeFont: 'Inter, sans-serif'
      }
    }
  });

  // 4. Create Tenant Admin Users
  const voltAdmin = await prisma.user.create({
    data: {
      email: 'ravi@voltpro.in',
      name: 'Ravi Teja',
      passwordHash,
      role: 'TENANT_ADMIN',
      tenantId: voltProTenant.id
    }
  });

  const coolAdmin = await prisma.user.create({
    data: {
      email: 'suresh@coolflow.in',
      name: 'Suresh Raina',
      passwordHash,
      role: 'TENANT_ADMIN',
      tenantId: coolFlowTenant.id
    }
  });

  // 5. Create Worker & Customer Users
  const voltTech = await prisma.user.create({
    data: {
      email: 'chandra@voltpro.in',
      name: 'Chandra Sekhar',
      passwordHash,
      role: 'WORKER',
      tenantId: voltProTenant.id
    }
  });

  const voltCustomer = await prisma.user.create({
    data: {
      email: 'kalyan@gmail.com',
      name: 'Kalyan Ram',
      passwordHash,
      role: 'CUSTOMER',
      tenantId: voltProTenant.id
    }
  });

  // 6. Worker Specs
  const worker = await prisma.worker.create({
    data: {
      userId: voltTech.id,
      tenantId: voltProTenant.id,
      skills: ['Wiring', 'Troubleshooting', 'Inverter', 'Solar'],
      availability: 'available',
      aadhaarValid: true,
      panValid: true,
      rating: 4.9
    }
  });

  // 7. Services list for VoltPro
  const service1 = await prisma.service.create({
    data: {
      id: 'svc-volt-001',
      tenantId: voltProTenant.id,
      name: 'Short Circuit & Sparking Repair',
      category: 'Troubleshooting',
      description: 'Instant diagnosis & repair of tripping MCBs, burning smells, and socket sparks.',
      icon: '⚡',
      basePrice: 350,
      durationMin: 45,
      isActive: true
    }
  });

  const service2 = await prisma.service.create({
    data: {
      id: 'svc-volt-002',
      tenantId: voltProTenant.id,
      name: 'Full House Electrical Rewiring',
      category: 'Installation',
      description: 'Complete ISI-grade concealed conduit wiring with fire-retardant cables & testing.',
      icon: '🏠',
      basePrice: 4999,
      durationMin: 240,
      isActive: true
    }
  });

  const service3 = await prisma.service.create({
    data: {
      id: 'svc-volt-003',
      tenantId: voltProTenant.id,
      name: 'Inverter & Battery Setup',
      category: 'Installation',
      description: 'Complete sine-wave inverter installation with heavy-duty battery rack & safety bypass.',
      icon: '🔋',
      basePrice: 799,
      durationMin: 90,
      isActive: true
    }
  });

  // 8. Services list for CoolFlow
  await prisma.service.create({
    data: {
      id: 'svc-cool-001',
      tenantId: coolFlowTenant.id,
      name: 'AC Jet-Pump Deep Cleaning',
      category: 'Service',
      description: 'High pressure foam wash for indoor filters, evaporator coil, and outdoor condenser.',
      icon: '❄️',
      basePrice: 499,
      durationMin: 60,
      isActive: true
    }
  });

  await prisma.service.create({
    data: {
      id: 'svc-cool-002',
      tenantId: coolFlowTenant.id,
      name: 'R32 / R410A Gas Refilling with Leak Test',
      category: 'Repair',
      description: 'Nitrogen leak testing, copper flare tightening, vacuuming & 100% pure gas charge.',
      icon: '🧊',
      basePrice: 1499,
      durationMin: 90,
      isActive: true
    }
  });

  // 9. Bookings Mock
  await prisma.booking.create({
    data: {
      id: 'BK-VOLT-8921',
      tenantId: voltProTenant.id,
      customerId: voltCustomer.id,
      serviceId: service1.id,
      workerId: worker.id,
      status: 'ASSIGNED',
      scheduledDate: '2026-09-02',
      scheduledTime: '10:00 AM',
      priceTotal: 350,
      taxTotal: 63,
      discountTotal: 0,
      netTotal: 413,
      formData: {
        customerName: 'Kalyan Ram',
        customerPhone: '9876500001',
        customerAddress: 'Flat 302, Green Meadows, Nellore',
        notes: 'Main MCB tripping repeatedly when AC turns on.'
      }
    }
  });

  // 10. Leads Mock
  await prisma.lead.create({
    data: {
      id: 'lead-v-001',
      tenantId: voltProTenant.id,
      name: 'Prasad Babu',
      phone: '9000112233',
      email: 'prasadb@gmail.com',
      serviceInterest: 'Full House Rewiring',
      notes: 'Requested quotation for new 3BHK villa construction.',
      status: 'contacted'
    }
  });

  await prisma.lead.create({
    data: {
      id: 'lead-v-002',
      tenantId: voltProTenant.id,
      name: 'Anusha Reddy',
      phone: '9888776655',
      email: 'anusha.r@outlook.com',
      serviceInterest: 'Inverter & Battery Setup',
      notes: 'Looking for 150Ah tubular battery setup.',
      status: 'new'
    }
  });

  console.log('✅ PostgreSQL database seeded successfully with real tenants, users, services, leads and bookings!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
