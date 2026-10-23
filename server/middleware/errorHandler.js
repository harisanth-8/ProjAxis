import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - Error:`, err.message);

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'INVALID_ID', `Invalid identifier format for field '${err.path}'`);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Database validation failed', details);
  }

  // MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, 409, 'DUPLICATE_KEY', `A record with this ${field} already exists`);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Authentication token is invalid');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
  }

  // Custom App Error
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 409 ? 'CONFLICT' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 400 ? 'BAD_REQUEST' : 'SERVER_ERROR');
  const message = err.isPublic ? err.message : (statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  return sendError(res, statusCode, code, message, err.details);
};
