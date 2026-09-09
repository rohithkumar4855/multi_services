import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { otpRateLimiter } from '../middlewares/otpRateLimiter';

const router = Router();

// Primary Email OTP Verification Routes
router.post('/send-email-otp', otpRateLimiter, AuthController.sendOtp);
router.post('/verify-email-otp', otpRateLimiter, AuthController.verifyOtp);
router.post('/resend-email-otp', otpRateLimiter, AuthController.resendOtp);

// Route Aliases
router.post('/send-otp', otpRateLimiter, AuthController.sendOtp);
router.post('/verify-otp', otpRateLimiter, AuthController.verifyOtp);
router.post('/resend-otp', otpRateLimiter, AuthController.resendOtp);

// General / Admin / Staff Auth
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Customer Website Auth
router.post('/customer/register', AuthController.customerRegister);
router.post('/customer/login', AuthController.customerLogin);

export default router;
