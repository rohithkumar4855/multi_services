import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
  lastRequestTime: number;
}

const ipLimits = new Map<string, RateLimitRecord>();

// Cleanup stale IP entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipLimits.entries()) {
    if (now - record.lastRequestTime > 15 * 60 * 1000) {
      ipLimits.delete(ip);
    }
  }
}, 15 * 60 * 1000);

/**
 * IP-based rate limiter for OTP endpoints
 * Maximum 15 requests per 10 minutes per IP
 */
export const otpRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const MAX_REQUESTS = 20;

  const record = ipLimits.get(ip);

  if (!record) {
    ipLimits.set(ip, {
      count: 1,
      firstRequestTime: now,
      lastRequestTime: now
    });
    return next();
  }

  // If window expired, reset window
  if (now - record.firstRequestTime > WINDOW_MS) {
    record.count = 1;
    record.firstRequestTime = now;
    record.lastRequestTime = now;
    return next();
  }

  record.count += 1;
  record.lastRequestTime = now;

  if (record.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - record.firstRequestTime)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return next(new AppError('Too many requests from this IP. Please try again in a few minutes.', 429));
  }

  next();
};
