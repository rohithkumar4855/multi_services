import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface SendOtpEmailParams {
  to: string;
  otp: string;
  expiryMinutes?: number;
  businessName?: string;
}

export class EmailService {
  private static transporter: any = null;

  /**
   * Get or initialize Nodemailer transporter for SMTP
   */
  private static getTransporter(): any {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!user || !pass) {
      logger.warn('[EmailService] SMTP credentials missing in .env (SMTP_USER or SMTP_PASS not set).');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    return this.transporter;
  }

  /**
   * Validate SMTP connection on backend startup
   */
  static async verifyConnection(): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      logger.warn('[EmailService] SMTP verification skipped: Credentials not set in .env');
      return false;
    }

    try {
      await transporter.verify();
      logger.info(`[EmailService] ✓ SMTP Connection to ${process.env.SMTP_HOST || 'smtp.gmail.com'} successfully verified.`);
      return true;
    } catch (err: any) {
      logger.error(`[EmailService] ❌ SMTP Verification Failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Send OTP verification email
   */
  static async sendOtpEmail({
    to,
    otp,
    expiryMinutes = 5,
    businessName = 'ServOS'
  }: SendOtpEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || `"${businessName}" <no-reply@servos.in>`;
    const subject = `Your Email Verification Code: ${otp}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #030712;
      color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #030712;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #0b1329;
      border: 1px solid #1e293b;
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .brand-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 20px 0;
    }
    .otp-box {
      background: #030712;
      border: 1px solid #2563eb;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #38bdf8;
      display: block;
    }
    .expiry {
      font-size: 12px;
      color: #cbd5e1;
      margin-top: 8px;
      display: block;
    }
    .footer {
      border-top: 1px solid #1e293b;
      margin-top: 28px;
      padding-top: 20px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .highlight {
      color: #38bdf8;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">
        <span class="brand-title">${businessName}</span>
        <span class="brand-badge">Verification</span>
      </div>
      
      <h1>Verify your email</h1>
      <p>Your verification code is:</p>
      
      <div class="otp-box">
        <span class="otp-code">${otp}</span>
        <span class="expiry">⏱ This code expires in <strong>${expiryMinutes} minutes</strong>.</span>
      </div>
      
      <p>If you did not request this code, you can safely ignore this email.</p>
      
      <div class="footer">
        <p style="margin: 0;">This is an automated security notification sent to <span class="highlight">${to}</span>.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `${businessName}\n\nVerify your email\n\nYour verification code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.\n\nIf you did not request this code, you can safely ignore this email.`;

    // 1. Send via Resend API if configured
    if (process.env.EMAIL_PROVIDER === 'resend' || process.env.RESEND_API_KEY) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [to],
              subject,
              html: htmlContent,
              text: textContent
            })
          });

          const data = await res.json() as any;
          if (res.ok && data?.id) {
            logger.info(`[EmailService] OTP email delivered via Resend to ${to} (MessageId: ${data.id})`);
            return { success: true, messageId: data.id };
          } else {
            logger.error(`[EmailService] Resend API error: ${JSON.stringify(data)}`);
          }
        } catch (err: any) {
          logger.error(`[EmailService] Failed to send via Resend: ${err?.message}`);
        }
      }
    }

    // 2. Send via SMTP Nodemailer (Gmail / custom SMTP)
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        logger.info(`[SMTP] Attempting to send email to ${to} from ${fromAddress}...`);
        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html: htmlContent,
          text: textContent
        });
        logger.info(`[SMTP] ✓ Email sent successfully to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        logger.error(`[SMTP] ❌ Error sending email: ${err?.message}`);
        return { success: false, error: err?.message };
      }
    }

    // 3. Development Fallback logging if no SMTP credentials are configured
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`=======================================================`);
      logger.info(`[EmailService - DEV MODE] Email to: ${to}`);
      logger.info(`[EmailService - DEV MODE] OTP Code: ${otp}`);
      logger.info(`[EmailService - DEV MODE] Subject: ${subject}`);
      logger.info(`=======================================================`);
      return { success: true, messageId: `dev-mock-${Date.now()}` };
    }

    logger.warn(`[EmailService] No active email provider configured for production.`);
    return { success: false, error: 'No active email provider configured' };
  }
}
