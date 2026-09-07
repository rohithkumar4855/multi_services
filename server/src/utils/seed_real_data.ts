import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import { OrderStatus, PaymentStatus } from '@prisma/client';

async function seedRealData() {
  console.log(' Purging all old/demo/test data from database...');

  // Purge all existing tables safely in correct dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.fileRecord.deleteMany();
  await prisma.paymentWebhook.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.websitePage.deleteMany();
  await prisma.website.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log(' Seeding production-ready SaaS data with realistic businesses...');

  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashBusiness = await bcrypt.hash('business123', 10);
  const passwordHashCustomer = await bcrypt.hash('customer123', 10);

  // 1. GLOBAL SUPER ADMIN
  const superAdmin = await prisma.user.create({
    data: {
      id: 'super_admin_001',
      name: 'ServOS Super Administrator',
      email: 'admin@servos.in',
      phone: '+1 (800) 555-0199',
      passwordHash: passwordHashAdmin,
      role: 'SUPER_ADMIN',
      status: 'active'
    }
  });

  console.log(' Super Admin created: admin@servos.in (pass: admin123)');

  // 2. TENANT 1: VoltPro Electrical & Energy
  const tenant1 = await prisma.tenant.create({
    data: {
      id: 'tenant_voltpro',
      name: 'VoltPro Electrical & Automation',
      slug: 'voltpro',
      customDomain: 'voltpro.com',
      plan: 'enterprise',
      status: 'active',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8',
      font: 'Inter, sans-serif',
      theme: 'modern',
      logo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80',
      favicon: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=64&q=80',
      businessInfo: {
        companyName: 'VoltPro Electrical Solutions Ltd.',
        ownerName: 'Vikram Sharma',
        email: 'vikram@voltpro.in',
        phone: '+91 98765 43210',
        address: '45 Tech Park Avenue, Cyber City',
        city: 'Bangalore, Karnataka',
        postalCode: '560100',
        gstNumber: '29ABCDE1234F1Z5',
        industryType: 'Electrical & Industrial Automation',
        tagline: 'Certified Power & Smart Energy Infrastructure'
      },
      settings: {
        currency: 'USD',
        currencySymbol: '$',
        taxRate: 8.5,
        allowOnlineBooking: true,
        allowOnlinePayments: true
      }
    }
  });

  const admin1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: 'Vikram Sharma',
      email: 'vikram@voltpro.in',
      phone: '+91 98765 43210',
      passwordHash: passwordHashBusiness,
      role: 'TENANT_ADMIN',
      status: 'active'
    }
  });

  const website1 = await prisma.website.create({
    data: {
      tenantId: tenant1.id,
      name: 'VoltPro Official Website',
      slug: tenant1.slug,
      isPublished: true,
      seoMeta: {
        metaTitle: 'VoltPro - Smart Electrical & Commercial Automation',
        metaDescription: 'Certified electrical contracting, EV charging station installations, and commercial energy audits.',
        keywords: 'electrical contractor, EV charging installation, smart home automation, power backup'
      },
      branding: {
        primaryColor: tenant1.primaryColor,
        secondaryColor: tenant1.secondaryColor,
        font: tenant1.font,
        theme: tenant1.theme
      }
    }
  });

  const pagesVoltPro = [
    {
      title: 'Home',
      slug: '',
      orderIndex: 0,
      seoTitle: 'VoltPro - Commercial & Residential Electrical Systems',
      seoDescription: 'Leading power engineering and smart energy solutions with 24/7 emergency response.',
      content: {
        hero: {
          headline: 'Next-Gen Power & Smart Energy Infrastructure',
          subheadline: 'Certified Master Electricians delivering enterprise-grade electrical installations, smart automation, and renewable energy integrations.',
          badge: ' ISO 9001:2015 & IEEE Certified Engineers',
          primaryCta: 'Book Service',
          secondaryCta: 'Browse Products'
        },
        features: [
          { title: 'Commercial EV Chargers', description: 'Level 2 & DC Fast Charger deployments with smart load balancing.', icon: 'Zap' },
          { title: 'Industrial Safety Audits', description: 'Comprehensive infrared thermal imaging and compliance certifications.', icon: 'ShieldCheck' },
          { title: '24/7 Rapid Dispatch', description: 'Guaranteed under 45-minute on-site arrival for critical electrical outages.', icon: 'Clock' }
        ]
      }
    },
    {
      title: 'About Us',
      slug: 'about',
      orderIndex: 1,
      seoTitle: 'About VoltPro Electrical Solutions',
      seoDescription: 'Over 12 years of electrical engineering excellence serving commercial and residential clients.',
      content: {
        headline: 'Engineering Trusted Power Solutions Since 2012',
        story: 'VoltPro started with a simple mission: bring safety, modern automation, and uncompromised quality to electrical infrastructure. Today, we manage over 15,000 active facilities.',
        stats: [
          { label: 'Completed Projects', value: '18,400+' },
          { label: 'Certified Electricians', value: '65+' },
          { label: 'Uptime Reliability', value: '99.98%' }
        ]
      }
    },
    {
      title: 'Services',
      slug: 'services',
      orderIndex: 2,
      seoTitle: 'Electrical Services Catalog - VoltPro',
      seoDescription: 'Explore our full spectrum of electrical engineering, repairs, and installations.'
    },
    {
      title: 'Products',
      slug: 'products',
      orderIndex: 3,
      seoTitle: 'Energy Equipment & Hardware - VoltPro',
      seoDescription: 'Genuine surge protectors, smart energy monitors, and power backup batteries.'
    },
    {
      title: 'Contact',
      slug: 'contact',
      orderIndex: 4,
      seoTitle: 'Contact VoltPro Support & Booking',
      seoDescription: 'Get 24/7 emergency dispatch or schedule an appointment with our engineers.',
      content: {
        email: 'vikram@voltpro.in',
        phone: '+91 98765 43210',
        address: '45 Tech Park Avenue, Cyber City, Bangalore'
      }
    },
    {
      title: 'FAQ',
      slug: 'faq',
      orderIndex: 5,
      seoTitle: 'Frequently Asked Questions - VoltPro',
      seoDescription: 'Answers regarding safety standards, warranties, and emergency pricing.',
      content: {
        faqs: [
          { question: 'Do you offer warranty on electrical wiring and hardware?', answer: 'Yes, we provide 1-year comprehensive warranty on all installations and manufacturer warranty on parts.' },
          { question: 'Are your technicians licensed and insured?', answer: 'All technicians carry Class-A Electrical Licenses and full liability insurance.' },
          { question: 'How do you handle emergency power outages?', answer: 'Our emergency team is stationed in designated mobile units to arrive on-site within 45 minutes.' }
        ]
      }
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      orderIndex: 6,
      seoTitle: 'Privacy Policy - VoltPro',
      seoDescription: 'Our commitment to protecting your client data and transactions.',
      content: { policyText: 'VoltPro maintains bank-grade 256-bit encryption for all client profiles, inspection blueprints, and financial records.' }
    },
    {
      title: 'Terms & Conditions',
      slug: 'terms',
      orderIndex: 7,
      seoTitle: 'Terms of Service - VoltPro',
      seoDescription: 'Standard terms of service for repair and contracting agreements.',
      content: { termsText: 'All electrical projects are governed by local building codes and safety regulations. Invoices are due upon satisfactory completion.' }
    }
  ];

  for (const p of pagesVoltPro) {
    await prisma.websitePage.create({
      data: {
        tenantId: tenant1.id,
        websiteId: website1.id,
        title: p.title,
        slug: p.slug,
        orderIndex: p.orderIndex,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        content: p.content || {},
        isPublished: true
      }
    });
  }

  // VoltPro Services
  const sVolt1 = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: 'Smart Home Automation & Control Setup',
      category: 'Automation',
      description: 'Centralized smart panel, app configuration, voice assistants, and automated lighting circuits.',
      basePrice: 180.00,
      durationMin: 120,
      icon: '',
      isActive: true
    }
  });

  const sVolt2 = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: 'Commercial Panel & Inverter Diagnostic',
      category: 'Diagnostics',
      description: 'Infrared thermal imaging, load balance analysis, and MCB breaker safety testing.',
      basePrice: 95.00,
      durationMin: 60,
      icon: '',
      isActive: true
    }
  });

  const sVolt3 = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: 'EV Charging Station Level-2 Installation',
      category: 'EV Infrastructure',
      description: 'Dedicated 240V 40A/50A line installation with weatherproof exterior enclosure and surge bypass.',
      basePrice: 350.00,
      durationMin: 180,
      icon: '',
      isActive: true
    }
  });

  // VoltPro Products
  const pVolt1 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: 'Industrial 12-Outlet Surge Protector Hub',
      description: '4320 Joules protection with dual USB-C fast charge and heavy-duty 14AWG steel casing.',
      price: 49.99,
      compareAtPrice: 69.99,
      stock: 75,
      category: 'Power Protection',
      images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'],
      isActive: true
    }
  });

  const pVolt2 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: 'Smart Wi-Fi Circuit Energy Monitor',
      description: 'Real-time wireless breaker monitoring with smartphone telemetry, solar tracking, and cost predictions.',
      price: 89.50,
      compareAtPrice: 119.00,
      stock: 40,
      category: 'Smart Devices',
      images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80'],
      isActive: true
    }
  });

  // VoltPro Customers & Orders
  const custVolt1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: 'Ananya Rao',
      email: 'ananya.rao@gmail.com',
      phone: '9876543210',
      passwordHash: passwordHashCustomer,
      role: 'CUSTOMER'
    }
  });

  const orderVolt1 = await prisma.order.create({
    data: {
      tenantId: tenant1.id,
      userId: custVolt1.id,
      orderNumber: 'ORD-VOLT-1001-A1',
      items: [
        { id: pVolt2.id, name: pVolt2.name, price: pVolt2.price, quantity: 1, type: 'product' },
        { id: pVolt1.id, name: pVolt1.name, price: pVolt1.price, quantity: 1, type: 'product' }
      ],
      subtotal: 139.49,
      tax: 11.85,
      discount: 0,
      total: 151.34,
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.COMPLETED,
      customerDetails: {
        name: 'Ananya Rao',
        email: 'ananya.rao@gmail.com',
        phone: '9876543210',
        address: 'Villa 14, Prestige Palm Meadows, Bangalore'
      },
      notes: 'Delivered and installed successfully.'
    }
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant1.id,
      userId: custVolt1.id,
      orderId: orderVolt1.id,
      paymentGateway: 'stripe',
      paymentId: 'pi_3M2K91L094194091',
      amount: 151.34,
      currency: 'USD',
      status: PaymentStatus.SUCCESS,
      utrNumber: 'STRIPE-TX-990141'
    }
  });

  const custVolt2 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: 'Rahul Verma',
      email: 'rahul.verma@techcorp.in',
      phone: '9845012345',
      passwordHash: passwordHashCustomer,
      role: 'CUSTOMER'
    }
  });

  const orderVolt2 = await prisma.order.create({
    data: {
      tenantId: tenant1.id,
      userId: custVolt2.id,
      orderNumber: 'ORD-VOLT-1002-B2',
      items: [
        { id: sVolt1.id, name: sVolt1.name, price: sVolt1.basePrice, quantity: 1, type: 'service' }
      ],
      subtotal: 180.00,
      tax: 15.30,
      discount: 0,
      total: 195.30,
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.CONFIRMED,
      customerDetails: {
        name: 'Rahul Verma',
        email: 'rahul.verma@techcorp.in',
        phone: '9845012345',
        address: 'Penthouse 4B, Koramangala 5th Block, Bangalore'
      }
    }
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant1.id,
      userId: custVolt2.id,
      orderId: orderVolt2.id,
      paymentGateway: 'razorpay',
      paymentId: 'pay_L01948195819',
      amount: 195.30,
      currency: 'USD',
      status: PaymentStatus.SUCCESS,
      utrNumber: 'RZP-ORD-7741'
    }
  });

  console.log(' Tenant 1 (VoltPro) seeded with real catalog, orders, and payments.');

  // 3. TENANT 2: ApexCare Health & Senior Wellness
  const tenant2 = await prisma.tenant.create({
    data: {
      id: 'tenant_apexcare',
      name: 'ApexCare Health & Nursing',
      slug: 'apexcare',
      customDomain: 'apexcare.health',
      plan: 'professional',
      status: 'active',
      primaryColor: '#0d9488',
      secondaryColor: '#0f766e',
      font: 'Inter, sans-serif',
      theme: 'medical',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=200&q=80',
      favicon: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=64&q=80',
      businessInfo: {
        companyName: 'ApexCare Home Healthcare Solutions Ltd.',
        ownerName: 'Dr. Sunita Menon',
        email: 'sunita@apexcare.in',
        phone: '+91 98222 11100',
        address: '12 Hospital Boulevard, Jubilee Hills',
        city: 'Hyderabad, Telangana',
        postalCode: '500033',
        gstNumber: '36AAACE9876K1Z2',
        industryType: 'Healthcare & Nursing Services',
        tagline: 'Compassionate, Certified Clinical Care at Your Doorstep'
      },
      settings: {
        currency: 'USD',
        currencySymbol: '$',
        taxRate: 5.0,
        allowOnlineBooking: true,
        allowOnlinePayments: true
      }
    }
  });

  const admin2 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      name: 'Dr. Sunita Menon',
      email: 'sunita@apexcare.in',
      phone: '+91 98222 11100',
      passwordHash: passwordHashBusiness,
      role: 'TENANT_ADMIN',
      status: 'active'
    }
  });

  const website2 = await prisma.website.create({
    data: {
      tenantId: tenant2.id,
      name: 'ApexCare Official Portal',
      slug: tenant2.slug,
      isPublished: true,
      seoMeta: {
        metaTitle: 'ApexCare - Certified Nursing & Home Healthcare',
        metaDescription: '24/7 Registered nurses, physiotherapists, and medical equipment for senior home care.',
        keywords: 'home nursing, physiotherapy, elder care, clinical diagnostics'
      },
      branding: {
        primaryColor: tenant2.primaryColor,
        secondaryColor: tenant2.secondaryColor,
        font: tenant2.font,
        theme: tenant2.theme
      }
    }
  });

  const pagesApexCare = [
    {
      title: 'Home',
      slug: '',
      orderIndex: 0,
      seoTitle: 'ApexCare - Home Nursing & Senior Care',
      seoDescription: 'Hospital quality patient care and specialized rehabilitation in the comfort of your home.',
      content: {
        hero: {
          headline: 'Compassionate, Certified Healthcare at Home',
          subheadline: 'Connecting families with background-verified registered nurses, licensed physiotherapists, and specialized elder care assistants.',
          badge: ' NABH Certified & Government Licensed',
          primaryCta: 'Request Nursing Care',
          secondaryCta: 'Medical Store'
        },
        features: [
          { title: '24/7 Registered Nurses', description: 'Experienced intensive care and post-operative attendants.', icon: 'HeartPulse' },
          { title: 'Physiotherapy At Home', description: 'Orthopedic, neurological, and geriatric rehabilitation sessions.', icon: 'Activity' },
          { title: 'Doorstep Diagnostics', description: 'Blood sampling and ECG with instant digital pathology reports.', icon: 'ClipboardCheck' }
        ]
      }
    },
    {
      title: 'About Us',
      slug: 'about',
      orderIndex: 1,
      seoTitle: 'About ApexCare Medical Services',
      seoDescription: 'Our team of medical practitioners providing dignified care for over 10,000 families.',
      content: {
        headline: 'Transforming Home Healthcare with Dignity and Medical Rigor',
        story: 'Founded by senior clinicians, ApexCare brings ICU-trained staff and personalized healthcare regimens directly to private residences.',
        stats: [
          { label: 'Treated Patients', value: '12,500+' },
          { label: 'Medical Staff', value: '110+' },
          { label: 'Patient Satisfaction', value: '99.7%' }
        ]
      }
    },
    {
      title: 'Services',
      slug: 'services',
      orderIndex: 2,
      seoTitle: 'Clinical Nursing & Therapy Services - ApexCare',
      seoDescription: 'Full list of nursing packages, physiotherapy, and medical attendant plans.'
    },
    {
      title: 'Products',
      slug: 'products',
      orderIndex: 3,
      seoTitle: 'Medical Equipment & Monitors - ApexCare',
      seoDescription: 'Hospital beds, oxygen concentrators, pulse oximeters, and orthopedic supports.'
    },
    {
      title: 'Contact',
      slug: 'contact',
      orderIndex: 4,
      seoTitle: 'Contact ApexCare Emergency Desk',
      seoDescription: 'Immediate patient admissions and medical consultations.',
      content: {
        email: 'sunita@apexcare.in',
        phone: '+91 98222 11100',
        address: '12 Hospital Boulevard, Jubilee Hills, Hyderabad'
      }
    },
    {
      title: 'FAQ',
      slug: 'faq',
      orderIndex: 5,
      seoTitle: 'Patient Care FAQs - ApexCare',
      seoDescription: 'Frequently asked questions regarding nursing shifts and equipment rentals.',
      content: {
        faqs: [
          { question: 'What qualifications do your nurses possess?', answer: 'All our nurses hold GNM or B.Sc. Nursing degrees with at least 3 years of clinical hospital experience.' },
          { question: 'Can I request a 12-hour or 24-hour live-in nurse?', answer: 'Yes, we provide flexible 8-hour, 12-hour, and 24-hour rotational live-in nursing shifts.' },
          { question: 'Do you deliver medical equipment?', answer: 'Yes, oxygen concentrators, hospital beds, and monitors are delivered and set up within 3 hours.' }
        ]
      }
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      orderIndex: 6,
      seoTitle: 'HIPAA & Patient Privacy - ApexCare',
      seoDescription: 'Stringent health data privacy and HIPAA compliance standards.',
      content: { policyText: 'ApexCare adheres strictly to patient confidentiality, medical record encryption, and doctor-patient privacy standards.' }
    },
    {
      title: 'Terms & Conditions',
      slug: 'terms',
      orderIndex: 7,
      seoTitle: 'Service Terms - ApexCare',
      seoDescription: 'Clinical guidelines and care agreement terms.',
      content: { termsText: 'All medical procedures are conducted under the direction of the patient treating physician.' }
    }
  ];

  for (const p of pagesApexCare) {
    await prisma.websitePage.create({
      data: {
        tenantId: tenant2.id,
        websiteId: website2.id,
        title: p.title,
        slug: p.slug,
        orderIndex: p.orderIndex,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        content: p.content || {},
        isPublished: true
      }
    });
  }

  // ApexCare Services
  const sApex1 = await prisma.service.create({
    data: {
      tenantId: tenant2.id,
      name: '24/7 Registered Nursing & Patient Care',
      category: 'Nursing',
      description: 'Comprehensive vital monitoring, IV administration, catheter care, and wound dressing by certified nurses.',
      basePrice: 120.00,
      durationMin: 480,
      icon: '',
      isActive: true
    }
  });

  const sApex2 = await prisma.service.create({
    data: {
      tenantId: tenant2.id,
      name: 'Post-Surgical Physiotherapy & Mobility Session',
      category: 'Therapy',
      description: 'Custom mobility exercises, joint rehabilitation, and electrotherapy pain management.',
      basePrice: 65.00,
      durationMin: 60,
      icon: '',
      isActive: true
    }
  });

  // ApexCare Products
  const pApex1 = await prisma.product.create({
    data: {
      tenantId: tenant2.id,
      name: 'Digital Blood Pressure & Oximeter Clinical Kit',
      description: 'Accurate clinical grade automatic BP monitor with heart arrhythmia detection and OLED pulse oximeter.',
      price: 55.00,
      compareAtPrice: 75.00,
      stock: 60,
      category: 'Diagnostic Devices',
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'],
      isActive: true
    }
  });

  // ApexCare Customers & Orders
  const custApex1 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      name: 'Kavita Patel',
      email: 'kavita.patel@gmail.com',
      phone: '9820011223',
      passwordHash: passwordHashCustomer,
      role: 'CUSTOMER'
    }
  });

  const orderApex1 = await prisma.order.create({
    data: {
      tenantId: tenant2.id,
      userId: custApex1.id,
      orderNumber: 'ORD-APEXC-1001-M1',
      items: [
        { id: sApex2.id, name: sApex2.name, price: sApex2.basePrice, quantity: 1, type: 'service' },
        { id: pApex1.id, name: pApex1.name, price: pApex1.price, quantity: 1, type: 'product' }
      ],
      subtotal: 120.00,
      tax: 6.00,
      discount: 0,
      total: 126.00,
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.COMPLETED,
      customerDetails: {
        name: 'Kavita Patel',
        email: 'kavita.patel@gmail.com',
        phone: '9820011223',
        address: 'Banjara Hills, Road No. 3, Hyderabad'
      }
    }
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant2.id,
      userId: custApex1.id,
      orderId: orderApex1.id,
      paymentGateway: 'stripe',
      paymentId: 'pi_3N9810148101901',
      amount: 126.00,
      currency: 'USD',
      status: PaymentStatus.SUCCESS,
      utrNumber: 'STRIPE-APX-8812'
    }
  });

  console.log(' Tenant 2 (ApexCare) seeded with real catalog, orders, and payments.');

  // 4. TENANT 3: Nexus Tech & CCTV Systems
  const tenant3 = await prisma.tenant.create({
    data: {
      id: 'tenant_nexustech',
      name: 'Nexus Security & Smart CCTV',
      slug: 'nexustech',
      customDomain: 'nexustech.io',
      plan: 'professional',
      status: 'active',
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      font: 'Inter, sans-serif',
      theme: 'modern',
      logo: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=200&q=80',
      favicon: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=64&q=80',
      businessInfo: {
        companyName: 'Nexus Security Systems Inc.',
        ownerName: 'Arjun Patel',
        email: 'arjun@nexustech.in',
        phone: '+91 99001 22334',
        address: '88 Cyber Gateway, Viman Nagar',
        city: 'Pune, Maharashtra',
        postalCode: '411014',
        gstNumber: '27AABCN1234P1Z8',
        industryType: 'CCTV & Network Security',
        tagline: 'Enterprise Video Surveillance & Access Control'
      },
      settings: {
        currency: 'USD',
        currencySymbol: '$',
        taxRate: 8.5,
        allowOnlineBooking: true,
        allowOnlinePayments: true
      }
    }
  });

  const admin3 = await prisma.user.create({
    data: {
      tenantId: tenant3.id,
      name: 'Arjun Patel',
      email: 'arjun@nexustech.in',
      phone: '+91 99001 22334',
      passwordHash: passwordHashBusiness,
      role: 'TENANT_ADMIN',
      status: 'active'
    }
  });

  const website3 = await prisma.website.create({
    data: {
      tenantId: tenant3.id,
      name: 'Nexus Tech Official Store',
      slug: tenant3.slug,
      isPublished: true,
      seoMeta: {
        metaTitle: 'Nexus Tech - 4K CCTV & Enterprise Access Systems',
        metaDescription: 'Ultra HD security cameras, biometric access control, and cloud NVR storage.',
        keywords: 'CCTV installation, cloud NVR, biometric access, security cameras'
      },
      branding: {
        primaryColor: tenant3.primaryColor,
        secondaryColor: tenant3.secondaryColor,
        font: tenant3.font,
        theme: tenant3.theme
      }
    }
  });

  const pagesNexus = [
    {
      title: 'Home',
      slug: '',
      orderIndex: 0,
      seoTitle: 'Nexus Security - Smart 4K Surveillance Solutions',
      seoDescription: 'Commercial & residential high-definition video surveillance and AI motion alerts.',
      content: {
        hero: {
          headline: 'Enterprise 4K Security & Smart Access Control',
          subheadline: 'Protecting your commercial facilities, warehouses, and homes with AI-powered cameras, license plate recognition, and encrypted cloud backups.',
          badge: ' NDAA Compliant & 3-Year Hardware Warranty',
          primaryCta: 'Request System Quote',
          secondaryCta: 'Explore Hardware'
        },
        features: [
          { title: '4K Ultra-HD Clarity', description: 'Color night vision and optical zoom up to 150ft.', icon: 'Camera' },
          { title: 'AI Perimeter Alerts', description: 'Real-time humanoid & vehicle detection without false alarms.', icon: 'BellRing' },
          { title: 'Cloud Redundancy', description: 'Tamper-proof offsite cloud backup with bank-grade encryption.', icon: 'Cloud' }
        ]
      }
    },
    {
      title: 'About Us',
      slug: 'about',
      orderIndex: 1,
      seoTitle: 'About Nexus Security Solutions',
      seoDescription: 'Securing enterprise infrastructure across 50+ cities.'
    },
    {
      title: 'Services',
      slug: 'services',
      orderIndex: 2,
      seoTitle: 'Surveillance & Access Control Services',
      seoDescription: 'CCTV setup, structured cabling, and biometric access integration.'
    },
    {
      title: 'Products',
      slug: 'products',
      orderIndex: 3,
      seoTitle: 'Security Hardware Store - Nexus Tech',
      seoDescription: 'IP cameras, PoE switches, NVRs, and smart door locks.'
    },
    {
      title: 'Contact',
      slug: 'contact',
      orderIndex: 4,
      seoTitle: 'Contact Nexus Security Engineers',
      seoDescription: 'Schedule a free on-site survey and security estimate.'
    },
    {
      title: 'FAQ',
      slug: 'faq',
      orderIndex: 5,
      seoTitle: 'Security FAQs - Nexus Tech',
      seoDescription: 'Common questions about remote viewing and data storage retention.'
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      orderIndex: 6,
      seoTitle: 'Privacy Policy - Nexus Tech',
      seoDescription: 'Surveillance data handling and video privacy policies.'
    },
    {
      title: 'Terms & Conditions',
      slug: 'terms',
      orderIndex: 7,
      seoTitle: 'Terms of Service - Nexus Tech',
      seoDescription: 'Hardware warranty and service agreement terms.'
    }
  ];

  for (const p of pagesNexus) {
    await prisma.websitePage.create({
      data: {
        tenantId: tenant3.id,
        websiteId: website3.id,
        title: p.title,
        slug: p.slug,
        orderIndex: p.orderIndex,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        content: p.content || {},
        isPublished: true
      }
    });
  }

  // Nexus Services & Products
  const sNexus1 = await prisma.service.create({
    data: {
      tenantId: tenant3.id,
      name: '4K IP Camera 4-Point Installation & Cloud NVR',
      category: 'Installation',
      description: '4-camera high definition installation with concealed Cat6 wiring, POE switch, and remote smartphone live view setup.',
      basePrice: 240.00,
      durationMin: 180,
      icon: '',
      isActive: true
    }
  });

  const pNexus1 = await prisma.product.create({
    data: {
      tenantId: tenant3.id,
      name: 'Ultra-HD 4K Weatherproof Dome IP Camera',
      description: 'Night color vision, two-way audio, AI smart tracking, and IP67 weatherproofing.',
      price: 89.00,
      compareAtPrice: 120.00,
      stock: 50,
      category: 'Cameras',
      images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80'],
      isActive: true
    }
  });

  const pNexus2 = await prisma.product.create({
    data: {
      tenantId: tenant3.id,
      name: '8-Channel 4K PoE Network Video Recorder (NVR)',
      description: 'Plug & Play 8-Port PoE with pre-installed 2TB surveillance hard drive for 30-day continuous recording.',
      price: 175.00,
      compareAtPrice: 225.00,
      stock: 25,
      category: 'Recorders',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'],
      isActive: true
    }
  });

  // Nexus Customers & Orders
  const custNexus1 = await prisma.user.create({
    data: {
      tenantId: tenant3.id,
      name: 'Deepak Roy',
      email: 'deepak.roy@innovate.com',
      phone: '9900112233',
      passwordHash: passwordHashCustomer,
      role: 'CUSTOMER'
    }
  });

  const orderNexus1 = await prisma.order.create({
    data: {
      tenantId: tenant3.id,
      userId: custNexus1.id,
      orderNumber: 'ORD-NEXUS-1001-S1',
      items: [
        { id: pNexus1.id, name: pNexus1.name, price: pNexus1.price, quantity: 1, type: 'product' },
        { id: pNexus2.id, name: pNexus2.name, price: pNexus2.price, quantity: 1, type: 'product' }
      ],
      subtotal: 264.00,
      tax: 22.44,
      discount: 0,
      total: 286.44,
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: OrderStatus.PROCESSING,
      customerDetails: {
        name: 'Deepak Roy',
        email: 'deepak.roy@innovate.com',
        phone: '9900112233',
        address: 'Innovate Hub, Viman Nagar, Pune'
      }
    }
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant3.id,
      userId: custNexus1.id,
      orderId: orderNexus1.id,
      paymentGateway: 'stripe',
      paymentId: 'pi_3P019481048109',
      amount: 286.44,
      currency: 'USD',
      status: PaymentStatus.SUCCESS,
      utrNumber: 'STRIPE-NEX-4190'
    }
  });

  console.log(' Tenant 3 (Nexus Tech) seeded with real catalog, orders, and payments.');

  // Create Subscriptions for all tenants
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  for (const t of [tenant1, tenant2, tenant3]) {
    await prisma.subscription.create({
      data: {
        tenantId: t.id,
        planName: t.plan,
        status: 'active',
        validUntil: nextYear,
        features: {
          customDomain: true,
          ecommerce: true,
          booking: true,
          crm: true,
          analytics: true,
          unlimitedProducts: true
        }
      }
    });

    // Record welcome notification
    await prisma.notification.create({
      data: {
        tenantId: t.id,
        type: 'welcome',
        title: `Welcome to ${t.name} Portal`,
        message: 'Your multi-tenant website is active and accepting online bookings and orders.',
        readStatus: false
      }
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: t.id,
        action: 'TENANT_PROVISIONED',
        entityType: 'TENANT',
        entityId: t.id,
        newValue: {
          name: t.name,
          slug: t.slug,
          plan: t.plan
        },
        ipAddress: '127.0.0.1',
        userAgent: 'ServOS Core Seeder Engine'
      }
    });
  }

  console.log('\n======================================================');
  console.log(' REAL PRODUCTION DATA SEEDING COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('\nAccess Credentials:');
  console.log(' Super Admin: admin@servos.in / admin123');
  console.log(' Tenant 1 (VoltPro): vikram@voltpro.in / business123 (Site: voltpro)');
  console.log(' Tenant 2 (ApexCare): sunita@apexcare.in / business123 (Site: apexcare)');
  console.log(' Tenant 3 (NexusTech): arjun@nexustech.in / business123 (Site: nexustech)');
  console.log(' Customer: ananya.rao@gmail.com / customer123');
  console.log('======================================================\n');
}

seedRealData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(' Seeding failed:', err);
    process.exit(1);
  });
