import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

if (env.SMTP_HOST && env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
  logger.info(`SMTP Mailer initialized using host: ${env.SMTP_HOST}`);
} else {
  logger.info('SMTP not configured. Emails will be logged to console.');
}

/**
 * Sends an email or logs to console if SMTP is not configured.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<boolean>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        html: html || text
      });
      logger.info(`Email sent successfully to ${to} [${subject}]`);
      return true;
    } catch (err) {
      logger.error(`Failed to send email to ${to}:`, err.message);
      return false;
    }
  } else {
    // Development / fallback mode: log to console without falsely claiming email delivery
    logger.info(`[DEV EMAIL MOCK] To: ${to} | Subject: "${subject}"\nBody: ${text}`);
    return false;
  }
};
