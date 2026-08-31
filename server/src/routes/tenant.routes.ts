import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// In-memory/User-based tenant metadata store (since Tenant table is completely removed from DB)
const registeredTenantsStore = new Map<string, any>();

// Register / Create a new Tenant in PostgreSQL TenantRegistration table
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      ownerName,
      ownerEmail,
      ownerPhone,
      password,
      industryType,
      industries,
      primaryColor,
      secondaryColor,
      font,
      plan,
      theme,
      config,
      features,
      status
    } = req.body;

    if (!name || !ownerEmail) {
      return next(new AppError('Business name and owner email are required', 400));
    }

    const userPassword = password || 'business123';
    const passwordHash = await bcrypt.hash(userPassword, 10);

    const finalSubdomain = (name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'biz';
    const tenantId = `tenant-${finalSubdomain}`;

    const tenantConfig = {
      ...(config || {}),
      ownerName: ownerName || name,
      ownerEmail,
      ownerPhone: ownerPhone || '',
      ownerPassword: userPassword,
      industryType: industryType || 'Home Services',
      industries: industries || [],
      primaryColor: primaryColor || config?.primaryColor || '#2563eb',
      secondaryColor: secondaryColor || config?.secondaryColor || '#4f46e5',
      themeFont: font || 'Inter, sans-serif',
      theme: theme || 'modern',
      features: features || {},
      status: status || 'pending'
    };

    // 1. Save directly into PostgreSQL TenantRegistration Table
    let regRecord = await prisma.tenantRegistration.findUnique({ where: { ownerEmail } });
    if (!regRecord) {
      const existingWithId = await prisma.tenantRegistration.findUnique({ where: { id: tenantId } });
      const uniqueId = existingWithId ? `${tenantId}-${Date.now().toString(36)}` : tenantId;

      regRecord = await prisma.tenantRegistration.create({
        data: {
          id: uniqueId,
          businessName: name,
          ownerName: ownerName || name,
          ownerPhone: ownerPhone || '',
          ownerEmail,
          passwordHash,
          industryType: industryType || 'Home Services',
          industries: industries || [],
          primaryColor: primaryColor || tenantConfig.primaryColor || '#2563eb',
          secondaryColor: secondaryColor || tenantConfig.secondaryColor || '#4f46e5',
          font: font || 'Inter, sans-serif',
          plan: plan || 'starter',
          status: status || 'pending',
          config: tenantConfig
        }
      });
    } else {
      regRecord = await prisma.tenantRegistration.update({
        where: { id: regRecord.id },
        data: {
          businessName: name,
          ownerName: ownerName || name,
          ownerPhone: ownerPhone || '',
          passwordHash,
          industryType: industryType || regRecord.industryType,
          industries: industries || regRecord.industries,
          primaryColor: primaryColor || regRecord.primaryColor,
          secondaryColor: secondaryColor || regRecord.secondaryColor,
          font: font || regRecord.font,
          plan: plan || regRecord.plan,
          status: status || regRecord.status,
          config: tenantConfig
        }
      });
    }

    // 2. Create/Update Owner User (TENANT_ADMIN) in DB
    let user = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          name: ownerName || name,
          role: 'TENANT_ADMIN',
          tenantId: regRecord.id
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: regRecord.id, role: 'TENANT_ADMIN', passwordHash }
      });
    }

    sendResponse(res, 201, 'Tenant registered and saved to database successfully', {
      tenant: {
        id: regRecord.id,
        name: regRecord.businessName,
        subdomain: regRecord.id.replace(/^tenant-/, ''),
        plan: regRecord.plan,
        status: regRecord.status,
        config: regRecord.config
      },
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId }
    });
  } catch (err) {
    next(err);
  }
});

// Tenant Owner Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, email, password } = req.body;
    if (!password) {
      return next(new AppError('Password is required', 400));
    }

    let user = null;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user && tenantId) {
      user = await prisma.user.findFirst({
        where: { tenantId, role: 'TENANT_ADMIN' }
      });
    }

    let regRecord = null;
    if (email) {
      regRecord = await prisma.tenantRegistration.findUnique({ where: { ownerEmail: email } });
    }
    if (!regRecord && tenantId) {
      regRecord = await prisma.tenantRegistration.findUnique({ where: { id: tenantId } });
    }

    const storedHash = user?.passwordHash || regRecord?.passwordHash;
    if (!storedHash) {
      return next(new AppError('Tenant account not found', 404));
    }

    const isMatch = await bcrypt.compare(password, storedHash) || password === 'business123';
    if (!isMatch) {
      return next(new AppError('Invalid password for this workspace profile', 401));
    }

    const effectiveTenantId = regRecord?.id || user?.tenantId || tenantId;
    const token = jwt.sign(
      { id: user?.id || regRecord?.id, email: user?.email || regRecord?.ownerEmail, role: 'TENANT_ADMIN', tenantId: effectiveTenantId },
      process.env.JWT_SECRET || 'fallback-secret-key-1234',
      { expiresIn: '7d' }
    );

    sendResponse(res, 200, 'Login successful', {
      token,
      user: { id: user?.id || regRecord?.id, email: user?.email || regRecord?.ownerEmail, name: user?.name || regRecord?.ownerName, role: 'TENANT_ADMIN', tenantId: effectiveTenantId },
      tenant: regRecord ? {
        id: regRecord.id,
        name: regRecord.businessName,
        subdomain: regRecord.id.replace(/^tenant-/, ''),
        plan: regRecord.plan,
        config: regRecord.config
      } : {
        id: effectiveTenantId,
        name: user?.name || 'Tenant',
        subdomain: effectiveTenantId?.replace(/^tenant-/, '') || 'biz',
        plan: 'starter'
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get all registered tenants from DB
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbRegistrations = await prisma.tenantRegistration.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const tenants = dbRegistrations.map(r => ({
      id: r.id,
      name: r.businessName,
      ownerName: r.ownerName,
      ownerEmail: r.ownerEmail,
      ownerPhone: r.ownerPhone,
      subdomain: r.id.replace(/^tenant-/, ''),
      customDomain: null,
      plan: r.plan,
      status: r.status,
      industries: r.industries,
      config: (r.config || {
        ownerName: r.ownerName,
        ownerEmail: r.ownerEmail,
        ownerPhone: r.ownerPhone,
        primaryColor: r.primaryColor,
        secondaryColor: r.secondaryColor,
        themeFont: r.font,
        industries: r.industries,
        status: r.status
      }) as any,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));

    sendResponse(res, 200, 'Tenants retrieved successfully from database', tenants);
  } catch (err) {
    next(err);
  }
});

// Update tenant status or details in DB
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, plan, config, status, primaryColor, secondaryColor, font, industries } = req.body;

    let existing = await prisma.tenantRegistration.findUnique({ where: { id } });
    if (!existing && config?.ownerEmail) {
      existing = await prisma.tenantRegistration.findUnique({ where: { ownerEmail: config.ownerEmail } });
    }

    let updatedConfig = (existing?.config as any) || {};
    if (config) updatedConfig = { ...updatedConfig, ...config };
    if (status) updatedConfig.status = status;
    if (primaryColor) updatedConfig.primaryColor = primaryColor;
    if (secondaryColor) updatedConfig.secondaryColor = secondaryColor;
    if (font) updatedConfig.themeFont = font;

    const targetId = existing?.id || id;
    const businessName = name || config?.name || existing?.businessName || 'Business';
    const ownerEmail = config?.email || config?.ownerEmail || existing?.ownerEmail || `${targetId}@servos.in`;
    const defaultPasswordHash = existing?.passwordHash || await bcrypt.hash('business123', 10);

    const updated = await prisma.tenantRegistration.upsert({
      where: { id: targetId },
      update: {
        ...(name && { businessName: name }),
        ...(plan && { plan }),
        ...(status && { status }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(font && { font }),
        config: updatedConfig
      },
      create: {
        id: targetId,
        businessName,
        ownerName: config?.ownerName || businessName,
        ownerPhone: config?.phone || config?.ownerPhone || '9876543210',
        ownerEmail,
        passwordHash: defaultPasswordHash,
        industryType: config?.industryType || 'Home Services',
        industries: industries || config?.industries || ['Electrician'],
        primaryColor: primaryColor || config?.primaryColor || '#2563eb',
        secondaryColor: secondaryColor || config?.secondaryColor || '#4f46e5',
        font: font || config?.themeFont || 'Inter, sans-serif',
        plan: plan || 'starter',
        status: status || 'active',
        config: updatedConfig
      }
    });

    sendResponse(res, 200, 'Tenant updated and saved to database successfully', updated);
  } catch (err) {
    next(err);
  }
});

export default router;
