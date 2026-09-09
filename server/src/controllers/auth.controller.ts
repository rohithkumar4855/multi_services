import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { sendResponse } from '../utils/response';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      sendResponse(res, 201, 'User registered successfully', user);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      sendResponse(res, 200, 'Login successful', result);
    } catch (err) {
      next(err);
    }
  }

  static async customerRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.customerRegister(req.body);
      sendResponse(res, 201, 'Customer registered successfully and saved to database', result);
    } catch (err) {
      next(err);
    }
  }

  static async customerLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.customerLogin(req.body);
      sendResponse(res, 200, 'Customer logged in successfully', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Send 6-digit OTP to email
   * POST /api/auth/send-otp
   */
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, businessName } = req.body;
      const result = await OtpService.sendOtp(email, businessName);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify submitted OTP
   * POST /api/auth/verify-otp
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const result = await OtpService.verifyOtp(email, otp);
      const statusCode = result.verified ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resend a fresh OTP
   * POST /api/auth/resend-otp
   */
  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, businessName } = req.body;
      const result = await OtpService.resendOtp(email, businessName);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
