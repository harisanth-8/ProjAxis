import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required. No token provided.');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 401, 'USER_NOT_FOUND', 'User belonging to this token no longer exists.');
    }

    if (user.accountStatus !== 'Active') {
      return sendError(res, 403, 'ACCOUNT_INACTIVE', `Your account is ${user.accountStatus}. Please contact the administrator.`);
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'INVALID_TOKEN', 'Session expired or token invalid. Please log in again.');
    }
    return next(err);
  }
};

/**
 * Middleware to require at least one matching role.
 * e.g. requireRole('admin', 'hod')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}].`
      );
    }

    return next();
  };
};

/**
 * Department scope enforcement for HOD.
 * Verifies if target department matches HOD's own department.
 */
export const checkDepartmentScope = (departmentIdExtractor) => {
  return (req, res, next) => {
    if (req.user.roles.includes('admin')) {
      return next(); // Admin has universal access
    }

    const targetDept = typeof departmentIdExtractor === 'function' ? departmentIdExtractor(req) : req.params.departmentId || req.body.departmentId;

    if (!targetDept || !req.user.departmentId) {
      return sendError(res, 403, 'FORBIDDEN', 'Department scope validation failed.');
    }

    if (req.user.departmentId.toString() !== targetDept.toString()) {
      return sendError(res, 403, 'FORBIDDEN', 'You can only manage resources within your own department.');
    }

    return next();
  };
};
