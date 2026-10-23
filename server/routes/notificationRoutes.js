import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  broadcastAnnouncement,
  getAnnouncements
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/announcements', getAnnouncements);
router.get('/announcement', getAnnouncements);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.post('/announcements', requireRole('admin'), broadcastAnnouncement);
router.post('/announcement', requireRole('admin'), broadcastAnnouncement);

export default router;
