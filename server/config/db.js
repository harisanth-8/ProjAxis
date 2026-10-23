import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isReplicaSet = false;

export const connectDB = async (uri = env.MONGO_URI) => {
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Check if connected instance supports transactions (replica set)
    try {
      const adminDb = conn.connection.db.admin();
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      if (status && status.ok) {
        isReplicaSet = true;
        logger.info('MongoDB Replica Set detected. Transactions are supported.');
      } else {
        isReplicaSet = false;
        logger.info('MongoDB Standalone detected. Using fallback transactional helper.');
      }
    } catch {
      isReplicaSet = false;
    }

    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

export const getIsReplicaSet = () => isReplicaSet;

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error.message);
  }
};
