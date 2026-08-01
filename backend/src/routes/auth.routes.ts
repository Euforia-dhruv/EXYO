import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRegistration, validateLogin } from '../middleware/validate.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, validateRegistration, AuthController.register);
router.post('/login', authLimiter, validateLogin, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
