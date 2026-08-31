import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'WORKER', 'CUSTOMER']),
  companyName: z.string().optional(),
  tenantId: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  formData: z.record(z.any()).optional()
});

export const assignWorkerSchema = z.object({
  workerId: z.string().uuid()
});

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const gstinSchema = z.string()
  .length(15, 'Please enter a valid 15-character GSTIN.')
  .regex(GSTIN_REGEX, 'Please enter a valid 15-character GSTIN.');
