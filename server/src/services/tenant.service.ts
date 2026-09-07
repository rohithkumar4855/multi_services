import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { AuditService } from './audit.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface RegisterTenantInput {
  id?: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  password?: string;
  industryType?: string;
  industries?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  plan?: string;
  theme?: string;
  config?: any;
  status?: string;
  gstNumber?: string | null;
  customDomain?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class TenantService {
  /**
   * Formats a database Tenant record to include frontend compatible fields (subdomain, ownerName, ownerEmail, config, etc.)
   */
  static formatTenant(tenant: any) {
    if (!tenant) return null;
    const businessInfo = (tenant.businessInfo || {}) as any;
    const settings = (tenant.settings || {}) as any;
    const config = settings.config || settings || {};

    return {
      ...tenant,
      subdomain: tenant.slug || tenant.subdomain,
      defaultDomain: tenant.defaultDomain || `${tenant.slug}.vercel.app`,
      customDomain: tenant.customDomain || null,
      domainStatus: tenant.domainStatus || 'active',
      domainVerified: tenant.domainVerified ?? false,
      lastDomainVerifiedAt: tenant.lastDomainVerifiedAt,
      ownerName: businessInfo.ownerName || tenant.ownerName || tenant.users?.[0]?.name || tenant.name,
      ownerEmail: businessInfo.email || tenant.ownerEmail || tenant.users?.[0]?.email || '',
      ownerPhone: businessInfo.phone || tenant.ownerPhone || tenant.users?.[0]?.phone || '',
      industries: businessInfo.industries || tenant.industries || [],
      industryType: businessInfo.industryType || tenant.industryType || 'Home Services',
      config: {
        ...config,
        primaryColor: tenant.primaryColor || config.primaryColor,
        secondaryColor: tenant.secondaryColor || config.secondaryColor,
        themeFont: tenant.font || config.themeFont || 'Inter, sans-serif',
        themeMode: tenant.theme || config.themeMode || 'light',
        logoText: config.logoText || tenant.name,
        logoImage: tenant.logo || config.logoImage || '',
        email: businessInfo.email || tenant.ownerEmail || config.email || '',
        phone: businessInfo.phone || tenant.ownerPhone || config.phone || '',
        address: businessInfo.address || config.address || 'Main Road, City Centre',
        city: businessInfo.city || config.city || 'Nellore, AP',
        gstNumber: businessInfo.gstNumber || config.gstNumber || ''
      }
    };
  }

  /**
   * Generates a collision-safe unique tenant slug.
   * e.g., "ABC Legal Services" -> "abc-legal-services", "abc-legal-services-2"
   */
  static async generateUniqueSlug(businessName: string): Promise<string> {
    const baseSlug = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'biz';

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.tenant.findUnique({ where: { slug } });
      if (!existing) {
        break;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  /**
   * Automatically creates Tenant, Admin user, Website, 8 Default Pages,
   * Default Catalog Services & Products, and initial notification within an atomic transaction.
   */
  static async registerTenant(input: RegisterTenantInput) {
    const {
      id,
      name,
      ownerName,
      ownerEmail,
      ownerPhone,
      password,
      industryType = 'Professional Services',
      industries = ['General Service'],
      primaryColor = '#2563eb',
      secondaryColor = '#4f46e5',
      font = 'Inter, sans-serif',
      plan = 'starter',
      theme = 'modern',
      config = {},
      status = 'pending',
      gstNumber,
      customDomain,
      ipAddress,
      userAgent
    } = input;

    const cleanEmail = ownerEmail.toLowerCase().trim();
    if (!name || !cleanEmail) {
      throw new AppError('Business name and valid owner email are required', 400);
    }

    // Check if user already exists as an admin
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail, role: 'TENANT_ADMIN' }
    });
    if (existingUser) {
      throw new AppError('An admin account with this email already exists', 400);
    }

    const slug = await this.generateUniqueSlug(name);
    const tenantId = id || `tenant_${slug.replace(/[^a-z0-9]/g, '_')}`;
    const passwordHash = await bcrypt.hash(password || 'admin123', 10);

    const defaultBusinessInfo = {
      name,
      ownerName: ownerName || name,
      email: cleanEmail,
      phone: ownerPhone || '+1 (555) 019-2834',
      address: '100 Business Parkway, Suite 400',
      industryType,
      industries,
      gstNumber: gstNumber || null,
      tagline: `Premier ${industryType} Solutions`,
      socialLinks: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
        instagram: 'https://instagram.com'
      }
    };

    const defaultSettings = {
      currency: 'INR',
      currencySymbol: 'INR',
      taxRate: 18,
      allowOnlineBooking: true,
      allowOnlinePayments: true,
      paymentGateways: {
        simulated: { enabled: true },
        stripe: { enabled: false, publicKey: '' },
        razorpay: { enabled: false, keyId: '' }
      },
      notifications: {
        emailAlerts: true,
        orderAlerts: true,
        paymentAlerts: true
      },
      config: { ...config, gstNumber: gstNumber || config.gstNumber || null },
      ...config
    };

    const defaultSeo = {
      metaTitle: `${name} | Official Website`,
      metaDescription: `Welcome to ${name}. We deliver exceptional ${industryType} and custom solutions tailored to your needs.`,
      keywords: `${name}, ${industryType}, online orders, services, products`,
      ogImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
    };

    const defaultBranding = {
      primaryColor,
      secondaryColor,
      font,
      theme,
      headerStyle: 'glassmorphism',
      footerText: `(c) ${new Date().getFullYear()} ${name}. All rights reserved.`
    };

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          name,
          slug,
          customDomain: customDomain || null,
          plan,
          status,
          primaryColor,
          secondaryColor,
          font,
          theme,
          logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${slug}`,
          favicon: `https://api.dicebear.com/7.x/identicon/svg?seed=${slug}`,
          businessInfo: defaultBusinessInfo,
          settings: defaultSettings
        }
      });

      // 1.1 Persist into TenantRegistration for complete database synchronization
      await tx.tenantRegistration.upsert({
        where: { ownerEmail: cleanEmail },
        update: {
          businessName: name,
          ownerName: ownerName || name,
          ownerPhone: ownerPhone || '',
          passwordHash,
          industryType,
          industries,
          primaryColor,
          secondaryColor,
          font,
          plan,
          status,
          config: defaultSettings.config,
          gstNumber: gstNumber || null
        },
        create: {
          id: tenant.id,
          businessName: name,
          ownerName: ownerName || name,
          ownerPhone: ownerPhone || '',
          ownerEmail: cleanEmail,
          passwordHash,
          industryType,
          industries,
          primaryColor,
          secondaryColor,
          font,
          plan,
          status,
          config: defaultSettings.config,
          gstNumber: gstNumber || null
        }
      });

      // 2. Create Admin User
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: ownerName || name,
          email: cleanEmail,
          phone: ownerPhone || null,
          passwordHash,
          role: 'TENANT_ADMIN',
          status: 'active'
        }
      });

      // 3. Create Auto-Generated Website
      const website = await tx.website.create({
        data: {
          tenantId: tenant.id,
          name: `${name} Official Website`,
          slug,
          customDomain: customDomain || null,
          isPublished: true,
          seoMeta: defaultSeo,
          branding: defaultBranding,
          navigation: [
            { label: 'Home', path: '/' },
            { label: 'About', path: '/about' },
            { label: 'Services', path: '/services' },
            { label: 'Products', path: '/products' },
            { label: 'Contact', path: '/contact' },
            { label: 'FAQ', path: '/faq' }
          ]
        }
      });

      // 4. Create 8 Default CMS Website Pages
      const defaultPages = [
        {
          title: 'Home',
          slug: '',
          orderIndex: 0,
          seoTitle: `${name} - Home & Services`,
          seoDescription: `Discover high quality services and products at ${name}.`,
          content: {
            hero: {
              headline: `Excellence in ${industryType}`,
              subheadline: `Delivering trusted, premium solutions for all your requirements with prompt delivery and 100% satisfaction guarantee.`,
              badge: 'Verified & Certified Partner',
              primaryCta: 'Explore Services',
              secondaryCta: 'Shop Catalog'
            },
            features: [
              { title: 'Certified Experts', description: 'Experienced professionals dedicated to quality work.', icon: 'ShieldCheck' },
              { title: 'Instant Booking & Ordering', description: 'Real-time booking and seamless checkout in seconds.', icon: 'Zap' },
              { title: 'Transparent Pricing', description: 'No hidden charges. Clear upfront quotes and digital receipts.', icon: 'Tag' }
            ]
          }
        },
        {
          title: 'About Us',
          slug: 'about',
          orderIndex: 1,
          seoTitle: `About Us - ${name}`,
          seoDescription: `Learn more about our history, mission, and dedication to customer success.`,
          content: {
            headline: `About ${name}`,
            story: `Founded with a vision to redefine ${industryType}, ${name} provides state-of-the-art products and services crafted to perfection.`,
            mission: 'To deliver superior quality, integrity, and peace of mind with every customer interaction.',
            stats: [
              { label: 'Happy Clients', value: '2,500+' },
              { label: 'Service Rating', value: '4.9 / 5' },
              { label: 'On-Time Completion', value: '99.4%' }
            ]
          }
        },
        {
          title: 'Services',
          slug: 'services',
          orderIndex: 2,
          seoTitle: `Our Services - ${name}`,
          seoDescription: `Browse our full suite of professional services with instant online booking.`,
          content: {
            headline: 'Comprehensive Services',
            subheadline: 'Book experienced specialists tailored to your exact timeline and requirements.'
          }
        },
        {
          title: 'Products',
          slug: 'products',
          orderIndex: 3,
          seoTitle: `Products & Store - ${name}`,
          seoDescription: `Explore top rated products with secure checkout and fast delivery.`,
          content: {
            headline: 'Featured Products & Supplies',
            subheadline: 'High quality genuine products with full warranty and guarantee.'
          }
        },
        {
          title: 'Contact',
          slug: 'contact',
          orderIndex: 4,
          seoTitle: `Contact Us - ${name}`,
          seoDescription: `Get in touch with our support team for questions, quotes, or emergency requests.`,
          content: {
            headline: 'Get in Touch',
            subheadline: 'Our team is available to assist you 24/7. Send a message or call directly.',
            email: cleanEmail,
            phone: ownerPhone || '+1 (555) 019-2834',
            address: defaultBusinessInfo.address
          }
        },
        {
          title: 'FAQ',
          slug: 'faq',
          orderIndex: 5,
          seoTitle: `Frequently Asked Questions - ${name}`,
          seoDescription: `Find quick answers to common questions about our services, orders, and policies.`,
          content: {
            faqs: [
              { question: 'How do I place an order or schedule a service?', answer: 'Simply browse our catalog, select your desired service or product, add it to cart, and complete our secure checkout.' },
              { question: 'What payment methods do you accept?', answer: 'We accept all major Credit/Debit cards, UPI, Bank Transfers, and Cash on Delivery / Pay after service.' },
              { question: 'What is your cancellation and refund policy?', answer: 'You can cancel free of charge up to 2 hours before scheduled fulfillment for a 100% full refund.' }
            ]
          }
        },
        {
          title: 'Privacy Policy',
          slug: 'privacy',
          orderIndex: 6,
          seoTitle: `Privacy Policy - ${name}`,
          seoDescription: `Privacy terms and data protection policies for customers of ${name}.`,
          content: {
            policyText: `At ${name}, we value your privacy. We strictly safeguard all customer information, transaction details, and contact data. Your information is never sold to third parties.`
          }
        },
        {
          title: 'Terms & Conditions',
          slug: 'terms',
          orderIndex: 7,
          seoTitle: `Terms of Service - ${name}`,
          seoDescription: `Terms and conditions governing orders and services placed through ${name}.`,
          content: {
            termsText: `By using the services and purchasing products from ${name}, you agree to adhere to standard fair use, verified service access, and timely payment policies.`
          }
        }
      ];

      for (const page of defaultPages) {
        await tx.websitePage.create({
          data: {
            tenantId: tenant.id,
            websiteId: website.id,
            title: page.title,
            slug: page.slug,
            orderIndex: page.orderIndex,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            content: page.content,
            isPublished: true
          }
        });
      }

      // 5. Create Default Services Catalog for immediate live functionality
      const defaultServices = [
        {
          name: 'Standard Inspection & Diagnostic',
          category: 'Diagnostics',
          description: 'Comprehensive system check, diagnostic testing, and detailed quote assessment.',
          basePrice: 49.00,
          durationMin: 45,
          icon: 'search'
        },
        {
          name: 'Premium Full-Service Package',
          category: 'Installation & Repair',
          description: 'Complete expert repair, component optimization, replacement, and warranty coverage.',
          basePrice: 129.00,
          durationMin: 90,
          icon: 'zap'
        },
        {
          name: 'Emergency Priority Response',
          category: 'Emergency',
          description: 'Guaranteed under 60-minute on-site arrival by a senior technician.',
          basePrice: 89.00,
          durationMin: 30,
          icon: 'alert'
        }
      ];

      for (const s of defaultServices) {
        await tx.service.create({
          data: {
            tenantId: tenant.id,
            name: s.name,
            category: s.category,
            description: s.description,
            basePrice: s.basePrice,
            durationMin: s.durationMin,
            icon: s.icon,
            isActive: true
          }
        });
      }

      // 6. Create Default Products Catalog
      const defaultProducts = [
        {
          name: 'Heavy-Duty Commercial Surge Protector',
          description: 'Industrial grade surge protector with 12 outlets and dual USB fast charging.',
          price: 39.99,
          compareAtPrice: 59.99,
          stock: 50,
          category: 'Hardware & Accessories',
          images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'],
          isActive: true
        },
        {
          name: 'Smart Energy Monitor Hub',
          description: 'Real-time wireless electricity monitor with smartphone telemetry and alerts.',
          price: 89.50,
          compareAtPrice: 119.00,
          stock: 35,
          category: 'Smart Devices',
          images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80'],
          isActive: true
        }
      ];

      for (const p of defaultProducts) {
        await tx.product.create({
          data: {
            tenantId: tenant.id,
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

      // 7. Create Welcome Notification
      await tx.notification.create({
        data: {
          tenantId: tenant.id,
          recipientId: adminUser.id,
          type: 'welcome',
          title: `Welcome to your new SaaS Website, ${name}!`,
          message: `Your multi-tenant website (${slug}.yourplatform.com) has been generated with 8 default pages and catalog items. You can customize branding, colors, and products anytime.`,
          readStatus: false
        }
      });

      // 8. Create Subscription Record
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planName: plan,
          status: 'active',
          validUntil: oneYearFromNow,
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

      return { tenant, adminUser, website };
    });

    // Automatically initialize Razorpay payment configuration for the new tenant
    try {
      const { PaymentGatewayService } = await import('./paymentGateway.service');
      await PaymentGatewayService.autoInitTenantGateway(result.tenant.id);
    } catch (err: any) {
      console.error('Error auto-initializing payment gateway for new tenant:', err.message);
    }

    // Record Audit Log outside transaction
    await AuditService.log({
      tenantId: result.tenant.id,
      userId: result.adminUser.id,
      action: 'TENANT_CREATED',
      entityType: 'TENANT',
      entityId: result.tenant.id,
      newValue: {
        name: result.tenant.name,
        slug: result.tenant.slug,
        adminEmail: cleanEmail,
        plan: result.tenant.plan
      },
      ipAddress,
      userAgent
    });

    // Generate JWT Token for Admin
    const token = jwt.sign(
      {
        id: result.adminUser.id,
        email: result.adminUser.email,
        role: 'TENANT_ADMIN',
        tenantId: result.tenant.id
      },
      process.env.JWT_SECRET || 'servos-super-secret-key-2026-anarav-tech',
      { expiresIn: '7d' }
    );

    return {
      token,
      tenant: TenantService.formatTenant(result.tenant),
      user: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        role: result.adminUser.role,
        tenantId: result.tenant.id
      },
      website: result.website
    };
  }

  /**
   * Resolves tenant information by slug, custom domain, or ID
   */
  static async resolveTenant(identifier: string) {
    if (!identifier) return null;

    const clean = identifier.trim().toLowerCase();

    // 1. Try slug
    let tenant = await prisma.tenant.findUnique({
      where: { slug: clean },
      include: {
        websites: {
          include: {
            pages: {
              where: { isPublished: true },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    });

    // 2. Try tenant ID
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { id: identifier },
        include: {
          websites: {
            include: {
              pages: {
                where: { isPublished: true },
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      });
    }

    // 3. Try custom domain or default domain
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: clean },
            { defaultDomain: clean },
            {
              domains: {
                some: { domain: clean }
              }
            }
          ]
        },
        include: {
          websites: {
            include: {
              pages: {
                where: { isPublished: true },
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      });
    }

    return TenantService.formatTenant(tenant);
  }

  /**
   * Updates Tenant branding, settings, and website configuration
   */
  static async updateTenantConfig(tenantId: string, data: any, userId?: string) {
    let existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!existing) {
      // Check if found by slug or registration ID
      const reg = await prisma.tenantRegistration.findUnique({ where: { id: tenantId } });
      if (reg) {
        existing = await prisma.tenant.findFirst({ where: { slug: reg.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
      }
    }
    if (!existing) {
      throw new AppError('Tenant not found', 404);
    }

    const {
      name,
      primaryColor,
      secondaryColor,
      font,
      theme,
      logo,
      favicon,
      businessInfo,
      settings,
      config,
      customDomain,
      status,
      plan
    } = data;

    const mergedSettings = { ...((existing.settings as any) || {}), ...(settings || {}), ...(config || {}) };
    console.log("TenantService.updateTenantConfig - received config:", JSON.stringify(config, null, 2).slice(0, 500));
    console.log("mergedSettings keys:", Object.keys(mergedSettings));

    const updated = await prisma.tenant.update({
      where: { id: existing.id },
      data: {
        ...(name && { name }),
        ...(primaryColor && { primaryColor }),
        ...(!primaryColor && config?.primaryColor && { primaryColor: config.primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(!secondaryColor && config?.secondaryColor && { secondaryColor: config.secondaryColor }),
        ...(font && { font }),
        ...(!font && config?.themeFont && { font: config.themeFont }),
        ...(theme && { theme }),
        ...(!theme && config?.themeMode && { theme: config.themeMode }),
        ...(logo !== undefined && { logo }),
        ...(!logo && config?.logoImage && { logo: config.logoImage }),
        ...(favicon !== undefined && { favicon }),
        ...(businessInfo && { businessInfo: { ...((existing.businessInfo as any) || {}), ...businessInfo } }),
        settings: Object.keys(mergedSettings).length > 0 ? mergedSettings : (existing.settings || {}),
        ...(customDomain !== undefined && { customDomain }),
        ...(status && { status }),
        ...(plan && { plan })
      }
    });

    // Also update associated Website branding
    if (primaryColor || secondaryColor || font || theme || config?.primaryColor || config?.secondaryColor || config?.themeFont || config?.themeMode) {
      await prisma.website.updateMany({
        where: { tenantId: existing.id },
        data: {
          branding: {
            primaryColor: updated.primaryColor,
            secondaryColor: updated.secondaryColor,
            font: updated.font,
            theme: updated.theme
          }
        }
      });
    }

    // Also update TenantRegistration table so it stays in sync
    try {
      const gstNum = data.gstNumber || (data.config as any)?.gstNumber || (existing.businessInfo as any)?.gstNumber || null;
      await prisma.tenantRegistration.upsert({
        where: { id: existing.id },
        update: {
          ...(name && { businessName: name }),
          ...(mergedSettings && { config: mergedSettings }),
          ...(gstNum !== undefined && { gstNumber: gstNum }),
          ...(status && { status }),
          ...(plan && { plan }),
          primaryColor: updated.primaryColor,
          secondaryColor: updated.secondaryColor,
          font: updated.font
        },
        create: {
          id: existing.id,
          businessName: updated.name,
          ownerName: (updated.businessInfo as any)?.ownerName || updated.name,
          ownerEmail: (updated.businessInfo as any)?.email || '',
          ownerPhone: (updated.businessInfo as any)?.phone || '',
          passwordHash: '',
          industryType: (updated.businessInfo as any)?.industryType || 'Home Services',
          industries: (updated.businessInfo as any)?.industries || [],
          primaryColor: updated.primaryColor,
          secondaryColor: updated.secondaryColor,
          font: updated.font,
          plan: updated.plan,
          status: updated.status,
          config: mergedSettings || updated.settings || {},
          gstNumber: gstNum
        }
      });
    } catch (err) {
      console.error('Error syncing TenantRegistration:', err);
    }

    await AuditService.log({
      tenantId: existing.id,
      userId,
      action: 'TENANT_CONFIG_UPDATED',
      entityType: 'TENANT',
      entityId: existing.id,
      oldValue: existing,
      newValue: updated
    });

    return TenantService.formatTenant(updated);
  }
}
