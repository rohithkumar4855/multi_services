import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// General / Admin / Staff Auth
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Customer Website Auth
router.post('/customer/register', AuthController.customerRegister);
router.post('/customer/login', AuthController.customerLogin);

export default router;
