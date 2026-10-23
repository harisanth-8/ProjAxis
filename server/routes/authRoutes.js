import express from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../validators/authValidators.js';
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile
} from '../controllers/authController.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again after 15 minutes.'
    }
  }
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
