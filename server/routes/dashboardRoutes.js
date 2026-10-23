import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getStudentDashboard,
  getGuideDashboard,
  getHodDashboard,
  getPanelDashboard,
  getAdminDashboard
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);

// Default dashboard endpoint dynamically resolves based on user's primary/active role
router.get('/', (req, res, next) => {
  const roles = req.user?.roles || ['student'];
  if (roles.includes('admin')) return getAdminDashboard(req, res, next);
  if (roles.includes('hod')) return getHodDashboard(req, res, next);
  if (roles.includes('guide')) return getGuideDashboard(req, res, next);
  if (roles.includes('panel')) return getPanelDashboard(req, res, next);
  return getStudentDashboard(req, res, next);
});

router.get('/student', requireRole('student', 'admin'), getStudentDashboard);
router.get('/guide', requireRole('guide', 'admin'), getGuideDashboard);
router.get('/hod', requireRole('hod', 'admin'), getHodDashboard);
router.get('/panel', requireRole('panel', 'admin'), getPanelDashboard);
router.get('/admin', requireRole('admin'), getAdminDashboard);

export default router;
