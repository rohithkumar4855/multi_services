import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Access Denied.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servos-super-secret-key-2026-anarav-tech') as any;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid token. Access Denied.', 401));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden. Insufficient permissions.', 403));
    }
    next();
  };
};

export const optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servos-super-secret-key-2026-anarav-tech') as any;
    req.user = decoded;
  } catch (error) {
    // Ignore invalid token for optional endpoints
  }
  next();
};
