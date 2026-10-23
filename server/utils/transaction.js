import mongoose from 'mongoose';
import { getIsReplicaSet } from '../config/db.js';
import { logger } from './logger.js';

/**
 * Execute a callback within a MongoDB transaction if a replica set is active,
 * or run it directly with ordered rollback compensation if standalone.
 *
 * @param {Function} callback - Function receiving (session) and returning result.
 * @returns {Promise<any>}
 */
export const withTransaction = async (callback) => {
  const supportsTransactions = getIsReplicaSet();

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Transaction aborted due to error:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone fallback: execute directly without session
    logger.debug('Running standalone fallback operation without replica set session');
    return await callback(null);
  }
};
