import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/projaxis',
  MONGO_IS_REPLICA_SET: process.env.MONGO_IS_REPLICA_SET === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'projaxis_super_secure_jwt_secret_key_2026_dev_mode',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'projaxis_cookie_secret_key_2026',
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '../uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || 'admin@projaxis.edu',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"ProjAxis Academic Portal" <noreply@projaxis.edu>'
};
