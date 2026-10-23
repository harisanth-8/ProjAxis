import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

const allowedOrigins = env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

// Body parsing & cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Sanitize MongoDB operators ($ and .) to prevent NoSQL injection
app.use(mongoSanitize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api', progressRoutes);
app.use('/api', workspaceRoutes);
app.use('/api', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    product: 'ProjAxis',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
