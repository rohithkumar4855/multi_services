import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
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
}
