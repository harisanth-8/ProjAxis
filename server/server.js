import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initCronJobs } from './services/cronService.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    await connectDB();
    initCronJobs();

    const server = app.listen(env.PORT, () => {
      logger.info(`ProjAxis Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`API available at http://localhost:${env.PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated.');
      });
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
