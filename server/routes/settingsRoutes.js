import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { fetchSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

// Allow reading settings (college name, logo, allowed types)
router.get('/', fetchSettings);

// Admin-only updates
router.put('/', authenticate, requireRole('admin'), updateSettings);
router.patch('/', authenticate, requireRole('admin'), updateSettings);

export default router;
