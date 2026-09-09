import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('business123', 10);
  const saHash = await bcrypt.hash('admin123', 10);

  console.log('🧹 Cleaning existing records...');
  await prisma.refund.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.websitePage.deleteMany({});
  await prisma.website.deleteMany({});
  await prisma.tenantPaymentGateway.deleteMany({});
  await prisma.tenantDomain.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.tenantRegistration.deleteMany({});

  // 1. Create Super Admin User
  await prisma.user.create({
    data: {
      email: 'admin@servos.in',
      name: 'Super Admin',
      passwordHash: saHash,
      role: 'SUPER_ADMIN'
    }
  });

  const tenantsData = [
    {
      id: 'tenant-1788761308098',
      name: 'pradeepvip',
      slug: 'pradeepvip',
      ownerName: 'pradeep',
      email: 'pradeep@123',
      phone: '2222222222',
      primaryColor: '#2563eb',
      secondaryColor: '#4f46e5',
      industryType: 'Home Services',
      industries: ['Electrician', 'Plumber', 'AC Service'],
      services: [
        { name: 'Short Circuit & Wiring Repair', category: 'Electrical', description: 'Diagnose and fix power failures, short circuits, and sparking switches.', basePrice: 450, durationMin: 45, icon: 'zap' },
        { name: 'Full House Wiring Inspection', category: 'Electrical', description: 'ISI grade conduit inspection and DB board load audit.', basePrice: 2499, durationMin: 180, icon: 'home' },
        { name: 'Pipe Leakage & Sanitary Fixing', category: 'Plumbing', description: 'High-pressure leak repair, tap replacements, and drainage unblocking.', basePrice: 399, durationMin: 45, icon: 'wrench' },
        { name: 'AC Deep Foam Cleaning & Jet Wash', category: 'HVAC', description: 'Filter wash, cooling coil foam cleaning, gas pressure telemetry check.', basePrice: 699, durationMin: 60, icon: 'wind' },
        { name: 'Emergency Power Backup Setup', category: 'Emergency', description: 'Inverter bypass setup and battery acid gravity balancing.', basePrice: 899, durationMin: 90, icon: 'battery-charging' }
      ],
      products: [
        { name: 'Smart MCB Distribution Panel (32A)', description: 'WiFi-enabled digital trip switch with overload cutoff telemetry.', price: 1499, compareAtPrice: 1999, stock: 45, category: 'Electrical Hardware', images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'] },
        { name: 'Brass Multi-Angle Kitchen Mixer Tap', description: 'Heavy chrome finish brass aerator tap with lifetime cartridge guarantee.', price: 1899, compareAtPrice: 2499, stock: 25, category: 'Sanitary Ware', images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'] }
      ],
      workers: [
        { name: 'Kalyan Verma', email: 'kalyan@pradeepvip.com', phone: '+91 98765 00001', skills: ['Electrical', 'Wiring', 'Inverter'], rating: 4.95, availability: 'available' },
        { name: 'Venkatesh Rao', email: 'venkatesh@pradeepvip.com', phone: '+91 98765 00002', skills: ['Plumbing', 'Sanitary', 'Drainage'], rating: 4.88, availability: 'available' },
        { name: 'Srinivas Murthy', email: 'srinivas@pradeepvip.com', phone: '+91 98765 00003', skills: ['HVAC', 'AC Servicing', 'Gas Refilling'], rating: 4.92, availability: 'available' },
        { name: 'Anil Kumar', email: 'anil@pradeepvip.com', phone: '+91 98765 00004', skills: ['Handyman', 'Repairs', 'Maintenance'], rating: 4.75, availability: 'busy' }
      ],
      leads: [
        { name: 'Vikram Reddy', phone: '+91 98480 11223', email: 'vikram.reddy@gmail.com', serviceInterest: 'Full House Wiring Overhaul', notes: 'New duplex villa near Hitech City requiring modular wiring quote.', status: 'contacted' },
        { name: 'Sunita Sharma', phone: '+91 98490 33445', email: 'sunita.s@yahoo.com', serviceInterest: '3 Split AC Servicing & Gas Top-up', notes: 'Master bedroom AC not cooling, requested morning 10 AM visit.', status: 'new' },
        { name: 'Rajesh Naidu', phone: '+91 97000 55667', email: 'rajesh.naidu@enterprise.com', serviceInterest: 'Commercial Sanitary Maintenance', notes: 'Annual maintenance contract for 3-storey office building.', status: 'in_progress' }
      ],
      bookings: [
        { customerName: 'Harish Babu', customerPhone: '+91 99887 11223', customerEmail: 'harish@gmail.com', serviceIdx: 0, status: 'COMPLETED' as const, priceTotal: 450, scheduledDate: '2026-09-05', scheduledTime: '11:00 AM' },
        { customerName: 'Sneha Patel', customerPhone: '+91 99887 22334', customerEmail: 'sneha.p@gmail.com', serviceIdx: 1, status: 'COMPLETED' as const, priceTotal: 2499, scheduledDate: '2026-09-06', scheduledTime: '02:30 PM' },
        { customerName: 'Mohammed Ghouse', customerPhone: '+91 99887 33445', customerEmail: 'ghouse.m@gmail.com', serviceIdx: 3, status: 'ASSIGNED' as const, priceTotal: 699, scheduledDate: '2026-09-07', scheduledTime: '04:00 PM', workerIdx: 2 },
        { customerName: 'Lakshmi Narayana', customerPhone: '+91 99887 44556', customerEmail: 'lakshmi.n@gmail.com', serviceIdx: 2, status: 'STARTED' as const, priceTotal: 399, scheduledDate: '2026-09-07', scheduledTime: '10:30 AM', workerIdx: 1 },
        { customerName: 'Deepak Choudhary', customerPhone: '+91 99887 55667', customerEmail: 'deepak.c@gmail.com', serviceIdx: 4, status: 'REQUESTED' as const, priceTotal: 899, scheduledDate: '2026-09-08', scheduledTime: '09:00 AM' },
        { customerName: 'Radhika Swamy', customerPhone: '+91 99887 66778', customerEmail: 'radhika.s@gmail.com', serviceIdx: 0, status: 'REQUESTED' as const, priceTotal: 450, scheduledDate: '2026-09-08', scheduledTime: '03:00 PM' }
      ]
    },
    {
      id: 'tenant-1',
      name: 'VoltPro Electricals',
      slug: 'voltpro',
      ownerName: 'Ravi Kumar',
      email: 'ravi@voltpro.in',
      phone: '+91 98765 43210',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8',
      industryType: 'Electrician',
      industries: ['Electrician', 'Solar', 'Inverter'],
      services: [
        { name: 'Short Circuit Repair', category: 'Troubleshooting', description: 'Diagnose and fix short circuits, sparking switches, fuse blows.', basePrice: 350, durationMin: 45, icon: 'zap' },
        { name: 'Full House Wiring', category: 'Installation', description: 'Complete ISI-grade wiring with conduit pipes and load balancing.', basePrice: 5000, durationMin: 240, icon: 'home' },
        { name: 'Fan & Light Installation', category: 'Installation', description: 'Install ceiling fans, chandeliers, downlights with safety clamps.', basePrice: 299, durationMin: 30, icon: 'sun' },
        { name: 'Inverter & Battery Setup', category: 'Backup Power', description: 'Full inverter wiring, bypass switch, and battery setup.', basePrice: 800, durationMin: 90, icon: 'battery' }
      ],
      products: [
        { name: 'Schneider 16A Modular Switch Board', description: 'Fire-retardant polycarbonate switchboard with indicator.', price: 650, compareAtPrice: 850, stock: 40, category: 'Switches', images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'] }
      ],
      workers: [
        { name: 'Kiran Reddy', email: 'kiran@voltpro.in', phone: '+91 98765 11101', skills: ['Wiring', 'Troubleshooting', 'Inverter'], rating: 4.9, availability: 'available' },
        { name: 'Prasad Varma', email: 'prasad@voltpro.in', phone: '+91 98765 11102', skills: ['DB Board', 'MCB Upgrade', 'Installation'], rating: 4.8, availability: 'available' }
      ],
      leads: [
        { name: 'Anand Rao', phone: '+91 98480 22331', email: 'anand@gmail.com', serviceInterest: 'Inverter Setup', notes: 'Needs 2kVA solar hybrid inverter installation.', status: 'new' }
      ],
      bookings: [
        { customerName: 'Suresh Raina', customerPhone: '+91 99887 77889', customerEmail: 'suresh@gmail.com', serviceIdx: 0, status: 'COMPLETED' as const, priceTotal: 350, scheduledDate: '2026-09-06', scheduledTime: '10:00 AM' },
        { customerName: 'Madhavan K', customerPhone: '+91 99887 88990', customerEmail: 'madhav@gmail.com', serviceIdx: 3, status: 'REQUESTED' as const, priceTotal: 800, scheduledDate: '2026-09-08', scheduledTime: '01:00 PM' }
      ]
    },
    {
      id: 'tenant-2',
      name: 'Apex Plumbing Solutions',
      slug: 'apexplumbing',
      ownerName: 'Suresh Naidu',
      email: 'suresh@apexplumbing.in',
      phone: '+91 98765 43211',
      primaryColor: '#0891b2',
      secondaryColor: '#0e7490',
      industryType: 'Plumber',
      industries: ['Plumber', 'Sanitary'],
      services: [
        { name: 'Pipe Leak Repair', category: 'Repair', description: 'Fix all pipe leaks with certified CPVC/UPVC fittings.', basePrice: 299, durationMin: 45, icon: 'droplet' },
        { name: 'Overhead Tank Cleaning', category: 'Cleaning', description: 'High pressure mechanized cleaning and UV sanitization.', basePrice: 499, durationMin: 90, icon: 'refresh-cw' }
      ],
      products: [
        { name: 'Heavy Duty PVC Ball Valve 1 Inch', description: 'Corrosion proof industrial grade water control valve.', price: 320, compareAtPrice: 450, stock: 60, category: 'Pipes & Fittings', images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'] }
      ],
      workers: [
        { name: 'Ramesh Babu', email: 'ramesh@apexplumbing.in', phone: '+91 98765 22201', skills: ['Leak Detection', 'Pipe Fitting'], rating: 4.85, availability: 'available' }
      ],
      leads: [
        { name: 'Gowtham Raj', phone: '+91 98480 33442', email: 'gowtham@gmail.com', serviceInterest: 'Bathroom Sanitary Overhaul', notes: 'Replace old concealed valves.', status: 'contacted' }
      ],
      bookings: [
        { customerName: 'Chaitanya V', customerPhone: '+91 99887 99001', customerEmail: 'chaitu@gmail.com', serviceIdx: 0, status: 'COMPLETED' as const, priceTotal: 299, scheduledDate: '2026-09-06', scheduledTime: '11:30 AM' }
      ]
    },
    {
      id: 'tenant-3',
      name: 'CoolBreeze AC Care',
      slug: 'coolbreeze',
      ownerName: 'Manoj Kumar',
      email: 'manoj@coolbreeze.in',
      phone: '+91 98765 43212',
      primaryColor: '#06b6d4',
      secondaryColor: '#0891b2',
      industryType: 'AC Service',
      industries: ['AC Service', 'HVAC'],
      services: [
        { name: 'AC Master Jet Servicing', category: 'Servicing', description: 'Foam wash, deep coil cleaning, filter scrub, and drainage unclogging.', basePrice: 499, durationMin: 60, icon: 'wind' },
        { name: 'Gas Refilling (R32 / R410A)', category: 'Repair', description: 'Precision electronic leak test and complete refrigerant top-up.', basePrice: 1200, durationMin: 90, icon: 'thermometer' }
      ],
      products: [
        { name: 'Universal Anti-Vibration Rubber AC Pads', description: 'Dampens outdoor unit vibrations and reduces compressor noise.', price: 399, compareAtPrice: 599, stock: 80, category: 'Accessories', images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'] }
      ],
      workers: [
        { name: 'Satish G', email: 'satish@coolbreeze.in', phone: '+91 98765 33301', skills: ['Refrigeration', 'Gas Charging', 'Diagnostics'], rating: 4.9, availability: 'available' }
      ],
      leads: [
        { name: 'Praveen K', phone: '+91 98480 44553', email: 'praveen@gmail.com', serviceInterest: 'Split AC Gas Charging', notes: 'AC blowing room temperature air.', status: 'new' }
      ],
      bookings: [
        { customerName: 'Tarun Tej', customerPhone: '+91 99887 11229', customerEmail: 'tarun@gmail.com', serviceIdx: 0, status: 'COMPLETED' as const, priceTotal: 499, scheduledDate: '2026-09-06', scheduledTime: '04:00 PM' }
      ]
    },
    {
      id: 'tenant-4',
      name: 'Royal Canvas Painters',
      slug: 'royalcanvas',
      ownerName: 'Anand Varma',
      email: 'anand@royalcanvas.in',
      phone: '+91 98765 43213',
      primaryColor: '#b45309',
      secondaryColor: '#92400e',
      industryType: 'Painting',
      industries: ['Painter', 'Wall Decor'],
      services: [
        { name: 'Interior Premium Emulsion (2 BHK)', category: 'Interior', description: 'Putty touch-up, primer coat, and 2 coats of Royale Luxury Emulsion.', basePrice: 8500, durationMin: 360, icon: 'brush' },
        { name: 'Waterproof Exterior Weather Defense', category: 'Exterior', description: 'Anti-fungal waterproof coat with 5-year anti-peel warranty.', basePrice: 15000, durationMin: 480, icon: 'shield' }
      ],
      products: [],
      workers: [
        { name: 'Murali Mohan', email: 'murali@royalcanvas.in', phone: '+91 98765 44401', skills: ['Texture Paint', 'Waterproofing', 'Roller Work'], rating: 4.95, availability: 'available' }
      ],
      leads: [],
      bookings: [
        { customerName: 'Divya Reddy', customerPhone: '+91 99887 33441', customerEmail: 'divya@gmail.com', serviceIdx: 0, status: 'COMPLETED' as const, priceTotal: 8500, scheduledDate: '2026-09-05', scheduledTime: '09:00 AM' }
      ]
    },
    {
      id: 'tenant-5',
      name: 'SparklePro Deep Clean',
      slug: 'sparklepro',
      ownerName: 'Kavitha Swamy',
      email: 'kavitha@sparklepro.in',
      phone: '+91 98765 43214',
      primaryColor: '#059669',
      secondaryColor: '#047857',
      industryType: 'Cleaning',
      industries: ['Cleaning', 'Sanitization'],
      services: [
        { name: 'Full Home Deep Sanitization', category: 'Deep Cleaning', description: 'End-to-end mechanized floor scrubbing, kitchen degreasing, and steam wash.', basePrice: 1999, durationMin: 240, icon: 'sparkles' },
        { name: 'Fabric Sofa & Upholstery Shampoo', category: 'Upholstery', description: 'High-suction extraction cleaning and deodorization for 5-seater sofa.', basePrice: 799, durationMin: 90, icon: 'archive' }
      ],
      products: [],
      workers: [
        { name: 'Revathi S', email: 'revathi@sparklepro.in', phone: '+91 98765 55501', skills: ['Steam Wash', 'Chemical Safety', 'Detailing'], rating: 4.88, availability: 'available' }
      ],
      leads: [],
      bookings: [
        { customerName: 'Abhishek J', customerPhone: '+91 99887 55661', customerEmail: 'abhi@gmail.com', serviceIdx: 0, status: 'COMPLETED' as const, priceTotal: 1999, scheduledDate: '2026-09-06', scheduledTime: '01:30 PM' }
      ]
    }
  ];

  for (const td of tenantsData) {
    console.log(`🚀 Seeding Tenant: ${td.name} (${td.id})...`);

    const businessInfo = {
      name: td.name,
      ownerName: td.ownerName,
      email: td.email,
      phone: td.phone,
      address: 'Plot 42, Main Road, City Center',
      city: 'Nellore, AP',
      industryType: td.industryType,
      industries: td.industries,
      gstNumber: '37AAAAA0000A1Z5',
      tagline: `Premier ${td.industryType} Solutions`,
      socialLinks: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' }
    };

    const settings = {
      primaryColor: td.primaryColor,
      secondaryColor: td.secondaryColor,
      theme: 'modern',
      themeFont: 'Inter, sans-serif',
      themeMode: 'dark',
      logoText: td.name,
      heroTitle: `Certified ${td.industryType} Experts at Your Doorstep`,
      heroSubtitle: `From emergency repairs to scheduled maintenance — fast, safe, guaranteed 30-day warranty across the city.`,
      email: td.email,
      phone: td.phone,
      whatsAppNumber: td.phone.replace(/[^0-9]/g, ''),
      address: 'Plot 42, Main Road, City Center',
      city: 'Nellore, AP',
      businessHours: '08:00 AM – 09:00 PM',
      taxRate: 18,
      currency: 'INR',
      currencySymbol: '₹',
      allowOnlineBooking: true,
      allowOnlinePayments: true,
      trustBadgesActive: true,
      companyVerification: {
        gstNumber: '37AAAAA0000A1Z5',
        status: 'verified'
      },
      paymentGateways: {
        razorpay: { enabled: true, mode: 'test' }
      },
      config: {
        primaryColor: td.primaryColor,
        secondaryColor: td.secondaryColor,
        themeMode: 'dark',
        heroTitle: `Certified ${td.industryType} Experts at Your Doorstep`,
        heroSubtitle: `From emergency repairs to scheduled maintenance — fast, safe, guaranteed 30-day warranty across the city.`
      }
    };

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: td.id,
        name: td.name,
        slug: td.slug,
        defaultDomain: `${td.slug}.vercel.app`,
        plan: 'starter',
        status: 'active',
        primaryColor: td.primaryColor,
        secondaryColor: td.secondaryColor,
        font: 'Inter, sans-serif',
        theme: 'modern',
        logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${td.slug}`,
        favicon: `https://api.dicebear.com/7.x/identicon/svg?seed=${td.slug}`,
        businessInfo,
        settings
      }
    });

    // 2. Create TenantRegistration
    await prisma.tenantRegistration.create({
      data: {
        id: td.id,
        businessName: td.name,
        ownerName: td.ownerName,
        ownerPhone: td.phone,
        ownerEmail: td.email,
        passwordHash,
        industryType: td.industryType,
        industries: td.industries,
        primaryColor: td.primaryColor,
        secondaryColor: td.secondaryColor,
        font: 'Inter, sans-serif',
        plan: 'starter',
        status: 'active',
        config: settings,
        gstNumber: '37AAAAA0000A1Z5'
      }
    });

    // 3. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        tenantId: td.id,
        name: td.ownerName,
        email: td.email,
        phone: td.phone,
        passwordHash,
        role: 'TENANT_ADMIN',
        status: 'active'
      }
    });

    // 4. Create Website and CMS Pages
    const website = await prisma.website.create({
      data: {
        tenantId: td.id,
        name: `${td.name} Official Website`,
        slug: td.slug,
        isPublished: true,
        branding: {
          primaryColor: td.primaryColor,
          secondaryColor: td.secondaryColor,
          font: 'Inter, sans-serif',
          theme: 'modern'
        }
      }
    });

    const defaultPages = [
      { title: 'Home', slug: '', orderIndex: 0 },
      { title: 'Services', slug: 'services', orderIndex: 1 },
      { title: 'Products', slug: 'products', orderIndex: 2 },
      { title: 'About Us', slug: 'about', orderIndex: 3 },
      { title: 'Contact', slug: 'contact', orderIndex: 4 },
      { title: 'FAQ', slug: 'faq', orderIndex: 5 },
      { title: 'Privacy Policy', slug: 'privacy', orderIndex: 6 },
      { title: 'Terms & Conditions', slug: 'terms', orderIndex: 7 }
    ];

    for (const page of defaultPages) {
      await prisma.websitePage.create({
        data: {
          tenantId: td.id,
          websiteId: website.id,
          title: page.title,
          slug: page.slug,
          orderIndex: page.orderIndex,
          isPublished: true
        }
      });
    }

    // 5. Create Services
    const createdServices: any[] = [];
    for (const s of td.services) {
      const createdService = await prisma.service.create({
        data: {
          tenantId: td.id,
          name: s.name,
          category: s.category,
          description: s.description,
          basePrice: s.basePrice,
          durationMin: s.durationMin,
          icon: s.icon,
          isActive: true
        }
      });
      createdServices.push(createdService);
    }

    // 6. Create Products
    for (const p of td.products) {
      await prisma.product.create({
        data: {
          tenantId: td.id,
          name: p.name,
          description: p.description,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          stock: p.stock,
          category: p.category,
          images: p.images,
          isActive: true
        }
      });
    }

    // 7. Create Workers
    const createdWorkers: any[] = [];
    for (const w of td.workers) {
      const workerUser = await prisma.user.create({
        data: {
          tenantId: td.id,
          name: w.name,
          email: w.email,
          phone: w.phone,
          passwordHash,
          role: 'WORKER',
          status: 'active'
        }
      });

      const worker = await prisma.worker.create({
        data: {
          userId: workerUser.id,
          tenantId: td.id,
          skills: w.skills,
          availability: w.availability,
          rating: w.rating,
          aadhaarValid: true,
          panValid: true
        }
      });
      createdWorkers.push(worker);
    }

    // 8. Create Leads
    for (const l of td.leads) {
      await prisma.lead.create({
        data: {
          tenantId: td.id,
          name: l.name,
          phone: l.phone,
          email: l.email,
          serviceInterest: l.serviceInterest,
          notes: l.notes,
          status: l.status
        }
      });
    }

    // 9. Create Bookings
    for (const b of td.bookings) {
      const targetService = createdServices[b.serviceIdx] || createdServices[0];
      const targetWorker = b.workerIdx !== undefined ? createdWorkers[b.workerIdx] : null;

      // Customer user
      const customerUser = await prisma.user.create({
        data: {
          tenantId: td.id,
          name: b.customerName,
          email: b.customerEmail,
          phone: b.customerPhone,
          passwordHash,
          role: 'CUSTOMER',
          status: 'active'
        }
      });

      const price = b.priceTotal;
      const tax = Math.round(price * 0.18);
      const net = price + tax;

      await prisma.booking.create({
        data: {
          tenantId: td.id,
          customerId: customerUser.id,
          serviceId: targetService.id,
          workerId: targetWorker ? targetWorker.id : null,
          status: b.status,
          scheduledDate: b.scheduledDate,
          scheduledTime: b.scheduledTime,
          priceTotal: price,
          taxTotal: tax,
          discountTotal: 0,
          netTotal: net,
          formData: {
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            customerEmail: b.customerEmail,
            customerAddress: 'Plot 12, Lake View Road, Nellore',
            serviceName: targetService.name,
            isEmergency: b.status === 'REQUESTED'
          }
        }
      });
    }
  }

  console.log('✅ PostgreSQL database seeded successfully with 6 complete tenants, workers, bookings, services, and leads!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
