import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  static async register(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 400);

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Dynamic tenant identifier setup for new tenants
    let tenantId = data.tenantId || (data.companyName ? (data.companyName).toLowerCase().replace(/[^a-z0-9]/g, '') : null);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        tenantId
      }
    });

    return { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
  }

  static async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET || 'fallback-secret-key-1234',
      { expiresIn: '1d' }
    );

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } };
  }
}
