import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getNextSequence } from '../models/Counter.js';
import { sendEmail } from './emailService.js';
import { logger } from '../utils/logger.js';

export const createNotification = async ({
  recipientId,
  category = 'System',
  message,
  relatedEntityType = null,
  relatedEntityId = null,
  sendEmailNotification = false
}) => {
  try {
    const seq = await getNextSequence('notification');
    const notificationId = `NOTIF-${String(seq).padStart(6, '0')}`;

    const notification = await Notification.create({
      notificationId,
      recipientId,
      category,
      message,
      relatedEntityType,
      relatedEntityId,
      status: 'Unread',
      date: new Date()
    });

    if (sendEmailNotification) {
      const recipient = await User.findById(recipientId);
      if (recipient && recipient.email) {
        sendEmail({
          to: recipient.email,
          subject: `[ProjAxis Notification] ${category}: ${message.slice(0, 50)}...`,
          text: `Hello ${recipient.name},\n\nYou have a new notification on ProjAxis:\n\n${message}\n\nPlease log in to ProjAxis to review details.\n\nBest regards,\nProjAxis Academic System`
        }).catch((e) => logger.error('Email notify error:', e.message));
      }
    }

    return notification;
  } catch (err) {
    logger.error('Error creating notification:', err.message);
    return null;
  }
};

export const notifyMultipleUsers = async (recipientIds, options) => {
  if (!recipientIds || !recipientIds.length) return [];
  const promises = recipientIds.map((id) =>
    createNotification({ ...options, recipientId: id })
  );
  return await Promise.all(promises);
};
