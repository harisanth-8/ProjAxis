import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { notifyMultipleUsers } from '../services/notificationService.js';
import { logActivity } from '../models/ActivityLog.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    const filter = { recipientId: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendSuccess(res, notifications, 200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      status: 'Unread'
    });
    return sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id
    });

    if (!notification) {
      return sendError(res, 404, 'NOT_FOUND', 'Notification not found');
    }

    notification.status = 'Read';
    await notification.save();

    return sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, status: 'Unread' },
      { $set: { status: 'Read' } }
    );
    return sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

export const broadcastAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetRole, departmentId } = req.body;

    if (!req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only administrators can broadcast announcements');
    }

    const filter = { accountStatus: 'Active' };
    if (targetRole) filter.roles = targetRole;
    if (departmentId) filter.departmentId = departmentId;

    const recipients = await User.find(filter).select('_id');
    const recipientIds = recipients.map((r) => r._id);

    await notifyMultipleUsers(recipientIds, {
      category: 'Announcement',
      message: `[Announcement] ${title}: ${message}`,
      sendEmailNotification: false
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'ADMIN_ANNOUNCEMENT_BROADCAST',
      entity: 'Notification',
      description: `Broadcasted announcement "${title}" to ${recipientIds.length} users`
    });

    return sendSuccess(res, {
      message: `Announcement broadcast successfully to ${recipientIds.length} recipients`,
      recipientCount: recipientIds.length
    }, 201);
  } catch (err) {
    next(err);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Notification.find({ category: 'Announcement' })
      .sort({ date: -1 })
      .limit(50);
    return sendSuccess(res, announcements);
  } catch (err) {
    next(err);
  }
};

