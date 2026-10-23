import cron from 'node-cron';
import Project from '../models/Project.js';
import Review from '../models/Review.js';
import Task from '../models/Task.js';
import ProgressReport from '../models/ProgressReport.js';
import Notification from '../models/Notification.js';
import { createNotification } from './notificationService.js';
import { logger } from '../utils/logger.js';

export const initCronJobs = () => {
  logger.info('Initializing ProjAxis background cron schedulers...');

  // 1. Run daily at 09:00 AM IST (03:30 UTC): Check for upcoming reviews in next 24 hours
  cron.schedule('30 3 * * *', async () => {
    try {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingReviews = await Review.find({
        status: 'Scheduled',
        reviewDate: { $gte: now, $lte: next24h }
      }).populate('projectId');

      for (const review of upcomingReviews) {
        if (!review.projectId) continue;

        // Check if reminder already sent today for this review
        const alreadyNotified = await Notification.findOne({
          relatedEntityType: 'Review',
          relatedEntityId: review._id.toString(),
          category: 'Review',
          date: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        });

        if (!alreadyNotified) {
          const studentIds = review.projectId.studentIds || [];
          const recipients = [...studentIds, review.guideId, ...(review.panelMemberIds || [])];

          for (const recipientId of recipients) {
            await createNotification({
              recipientId,
              category: 'Review',
              message: `Reminder: ${review.reviewType} for project "${review.projectId.title}" is scheduled within the next 24 hours at ${review.venue}.`,
              relatedEntityType: 'Review',
              relatedEntityId: review._id.toString(),
              sendEmailNotification: true
            });
          }
        }
      }
    } catch (err) {
      logger.error('Error in review reminder cron:', err.message);
    }
  });

  // 2. Run daily at 10:00 AM IST (04:30 UTC): Check for tasks due within 48 hours
  cron.schedule('30 4 * * *', async () => {
    try {
      const now = new Date();
      const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const dueTasks = await Task.find({
        status: { $in: ['To Do', 'In Progress'] },
        dueDate: { $gte: now, $lte: next48h },
        assigneeId: { $ne: null }
      });

      for (const task of dueTasks) {
        const alreadyNotified = await Notification.findOne({
          recipientId: task.assigneeId,
          relatedEntityType: 'Task',
          relatedEntityId: task._id.toString(),
          category: 'Task',
          date: { $gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) }
        });

        if (!alreadyNotified) {
          await createNotification({
            recipientId: task.assigneeId,
            category: 'Task',
            message: `Task due soon: "${task.title}" (ID: ${task.taskId}) is due on ${new Date(task.dueDate).toLocaleDateString()}.`,
            relatedEntityType: 'Task',
            relatedEntityId: task._id.toString(),
            sendEmailNotification: false
          });
        }
      }
    } catch (err) {
      logger.error('Error in task due reminder cron:', err.message);
    }
  });

  // 3. Weekly Sunday 20:00 IST (14:30 UTC): Check for missing weekly progress reports
  cron.schedule('30 14 * * 0', async () => {
    try {
      const activeProjects = await Project.find({ status: 'Active' });
      const now = new Date();

      // Find current week Monday
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);

      for (const project of activeProjects) {
        const report = await ProgressReport.findOne({
          projectId: project._id,
          weekStartDate: { $gte: monday }
        });

        if (!report) {
          // Missing weekly report reminder
          for (const studentId of project.studentIds) {
            await createNotification({
              recipientId: studentId,
              category: 'Progress',
              message: `Urgent: Weekly progress report for project "${project.title}" has not been submitted for the current week.`,
              relatedEntityType: 'Project',
              relatedEntityId: project._id.toString(),
              sendEmailNotification: true
            });
          }
        }
      }
    } catch (err) {
      logger.error('Error in weekly progress reminder cron:', err.message);
    }
  });
};
