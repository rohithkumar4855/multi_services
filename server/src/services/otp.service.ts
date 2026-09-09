import crypto from 'crypto';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { EmailService } from './email.service';
import { logger } from '../utils/logger';

export interface SendOtpResult {
  success: boolean;
  message: string;
}

export interface VerifyOtpResult {
  success: boolean;
  verified: boolean;
  message: string;
}

export class OtpService {
  private static readonly OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;
  private static readonly OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
  private static readonly OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60;
  private static readonly MAX_REQUESTS_PER_HOUR = 10;

  /**
   * Cryptographically hash an OTP using HMAC-SHA256
   */
  private static hashOtp(otp: string): string {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'servos-otp-salt-key-2026';
    return crypto.createHmac('sha256', secret).update(otp).digest('hex');
  }

  /**
   * Generate a cryptographically secure 6-digit numeric OTP
   */
  private static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate, store, and send an OTP to the user's email
   */
  static async sendOtp(email: string, businessName?: string): Promise<SendOtpResult> {
    logger.info(`[OTP] Request received for: ${email}`);

    if (!email || !this.isValidEmail(email)) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    logger.info(`[OTP] Email validated: ${normalizedEmail}`);

    const now = new Date();

    // Check hourly rate limit (max 10 OTPs per hour per email)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyCount = await prisma.emailOtp.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (hourlyCount >= this.MAX_REQUESTS_PER_HOUR) {
      throw new AppError('Too many verification requests for this email. Please try again later.', 429);
    }

    // Check 60s resend cooldown on the most recent OTP
    const latestOtp = await prisma.emailOtp.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' }
    });

    if (latestOtp) {
      const timeSinceLastSent = (now.getTime() - new Date(latestOtp.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < this.OTP_RESEND_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(this.OTP_RESEND_COOLDOWN_SECONDS - timeSinceLastSent);
        throw new AppError(`Please wait ${remainingSeconds} seconds before requesting a new code.`, 429);
      }
    }

    // Generate secure 6-digit OTP
    const rawOtp = this.generateSecureOtp();
    logger.info(`[OTP] OTP generated`);

    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate all previous unverified OTPs for this email
    await prisma.emailOtp.deleteMany({
      where: {
        email: normalizedEmail,
        verified: false
      }
    });

    // Create new OTP record in database
    await prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        expiresAt,
        verified: false,
        attempts: 0,
        createdAt: now,
        lastSentAt: now
      }
    });
    logger.info(`[OTP] OTP stored securely`);

    // Dispatch email via configured provider
    const sendResult = await EmailService.sendOtpEmail({
      to: normalizedEmail,
      otp: rawOtp,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
      businessName: businessName || 'Your Workspace'
    });

    if (!sendResult.success && process.env.NODE_ENV === 'production') {
      logger.error(`[OtpService] Email delivery failure for ${normalizedEmail}`);
      throw new AppError('Unable to send verification code at this time. Please try again later.', 500);
    }

    return {
      success: true,
      message: 'OTP sent successfully'
    };
  }

  /**
   * Verify an OTP submitted by the user
   */
  static async verifyOtp(email: string, otp: string): Promise<VerifyOtpResult> {
    if (!email || !this.isValidEmail(email)) {
      return {
        success: false,
        verified: false,
        message: 'Invalid email address.'
      };
    }

    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return {
        success: false,
        verified: false,
        message: 'Please enter a valid 6-digit numeric verification code.'
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Find the latest active OTP for this email
    const record = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        verified: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return {
        success: false,
        verified: false,
        message: 'No active verification code found for this email. Please request a new code.'
      };
    }

    // Check maximum attempts
    if (record.attempts >= this.OTP_MAX_ATTEMPTS) {
      // Invalidate the record due to brute-force attempts
      await prisma.emailOtp.delete({ where: { id: record.id } });
      return {
        success: false,
        verified: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.'
      };
    }

    // Check expiration
    if (now > new Date(record.expiresAt)) {
      await prisma.emailOtp.delete({ where: { id: record.id } });
      return {
        success: false,
        verified: false,
        message: 'This verification code has expired. Please request a new code.'
      };
    }

    // Compare hash securely
    const submittedHash = this.hashOtp(cleanOtp);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(record.otpHash, 'hex')
    );

    if (!isMatch) {
      // Increment attempt counter
      const updatedAttempts = record.attempts + 1;
      await prisma.emailOtp.update({
        where: { id: record.id },
        data: { attempts: updatedAttempts }
      });

      const remainingAttempts = this.OTP_MAX_ATTEMPTS - updatedAttempts;
      return {
        success: false,
        verified: false,
        message: remainingAttempts > 0
          ? `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
          : 'Invalid verification code. Maximum attempts reached.'
      };
    }

    // Mark as verified
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: {
        verified: true
      }
    });

    // Update existing user/tenant records if present
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: {
        emailVerified: true,
        emailVerifiedAt: now
      }
    });

    await prisma.tenantRegistration.updateMany({
      where: { ownerEmail: normalizedEmail },
      data: {
        emailVerified: true,
        emailVerifiedAt: now
      }
    });

    logger.info(`[OtpService] Email ${normalizedEmail} successfully verified.`);

    return {
      success: true,
      verified: true,
      message: 'Email verified successfully'
    };
  }

  /**
   * Resend a fresh OTP
   */
  static async resendOtp(email: string, businessName?: string): Promise<SendOtpResult> {
    return this.sendOtp(email, businessName);
  }

  /**
   * Server-side check: Verify that an email was verified within recent window (e.g. 15 minutes)
   */
  static async isEmailRecentlyVerified(email: string, maxAgeMinutes: number = 15): Promise<boolean> {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    const threshold = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const verifiedRecord = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        verified: true,
        createdAt: { gte: threshold }
      }
    });

    return !!verifiedRecord;
  }
}
