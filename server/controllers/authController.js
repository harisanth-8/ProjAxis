import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendEmail } from '../services/emailService.js';
import { logActivity } from '../models/ActivityLog.js';
import { logger } from '../utils/logger.js';

const generateTokenAndSetCookie = (res, user) => {
  const token = jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      departmentId: user.departmentId
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const isProd = env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  return token;
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, departmentId, regNo, semester, facultyId, hodId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'DUPLICATE_EMAIL', 'An account with this email address already exists');
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return sendError(res, 404, 'NOT_FOUND', 'Specified department does not exist');
    }

    // Role profile validations
    if (role === 'student') {
      const existingReg = await User.findOne({ 'student.regNo': regNo });
      if (existingReg) {
        return sendError(res, 409, 'DUPLICATE_REG_NO', 'Register number is already in use');
      }
    } else if (role === 'guide') {
      const existingFaculty = await User.findOne({ 'guide.facultyId': facultyId });
      if (existingFaculty) {
        return sendError(res, 409, 'DUPLICATE_FACULTY_ID', 'Faculty ID is already in use');
      }
    } else if (role === 'hod') {
      const existingHod = await User.findOne({ 'hod.hodId': hodId });
      if (existingHod) {
        return sendError(res, 409, 'DUPLICATE_HOD_ID', 'HOD ID is already in use');
      }
      // Check if an active HOD already exists for this department
      const currentActiveHod = await User.findOne({
        departmentId,
        roles: 'hod',
        accountStatus: 'Active'
      });
      if (currentActiveHod) {
        return sendError(res, 409, 'HOD_EXISTS', 'This department already has an active HOD assigned');
      }
    }

    const seq = await getNextSequence('user');
    const userId = `USR-${String(seq).padStart(4, '0')}`;
    const passwordHash = await User.hashPassword(password);

    // Students start Active. Guides and HODs start Pending Approval.
    const accountStatus = role === 'student' ? 'Active' : 'Pending Approval';

    const userData = {
      userId,
      name,
      email,
      passwordHash,
      phone: phone || '',
      roles: [role],
      departmentId,
      accountStatus,
      mustChangePassword: false
    };

    if (role === 'student') {
      userData.student = { regNo, semester, department: dept.name };
    } else if (role === 'guide') {
      userData.guide = { facultyId, department: dept.name };
    } else if (role === 'hod') {
      userData.hod = { hodId, department: dept.name };
    }

    const newUser = await User.create(userData);

    await logActivity({
      actor: { userId: newUser._id, name: newUser.name, role },
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: newUser.userId,
      description: `New user registered with role ${role} (Status: ${accountStatus})`
    });

    if (accountStatus === 'Active') {
      const token = generateTokenAndSetCookie(res, newUser);
      return sendSuccess(res, {
        user: newUser,
        token,
        message: 'Registration successful! You are now logged in.'
      }, 201);
    } else {
      return sendSuccess(res, {
        user: newUser,
        message: 'Registration received! Your faculty account is pending administrator approval before you can log in.'
      }, 201);
    }
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const EMAIL_ALIASES = {
      'guide.knuth@projaxis.edu': 'guide.subramanian@projaxis.edu',
      'panel.hopper@projaxis.edu': 'panel.radhakrishnan@projaxis.edu',
      'guide.lovelace@projaxis.edu': 'guide.meera@projaxis.edu',
      'guide.ritchie@projaxis.edu': 'guide.venkat@projaxis.edu',
      'guide.shannon@projaxis.edu': 'guide.jayaraman@projaxis.edu'
    };

    const targetEmail = (email && EMAIL_ALIASES[email.toLowerCase()]) || email;

    let user = await User.findOne({ email: targetEmail }).populate('departmentId', 'name code');
    if (!user && email) {
      user = await User.findOne({ email }).populate('departmentId', 'name code');
    }
    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (user.accountStatus === 'Pending Approval') {
      return sendError(res, 403, 'PENDING_APPROVAL', 'Your account is pending administrator approval.');
    }

    if (user.accountStatus === 'Inactive') {
      return sendError(res, 403, 'ACCOUNT_DEACTIVATED', 'Your account has been deactivated. Please contact the administrator.');
    }

    const token = generateTokenAndSetCookie(res, user);

    await logActivity({
      actor: { userId: user._id, name: user.name, role: user.roles[0] },
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.userId,
      description: `User ${user.email} logged in successfully`
    });

    return sendSuccess(res, {
      user,
      token,
      mustChangePassword: user.mustChangePassword
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const isProd = env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });

    if (req.user) {
      await logActivity({
        actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: req.user.userId,
        description: `User ${req.user.email} logged out`
      });
    }

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('departmentId', 'name code description');
    return sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 400, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    await logActivity({
      actor: { userId: user._id, name: user.name, role: user.roles[0] },
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: user.userId,
      description: `User ${user.email} updated their password`
    });

    return sendSuccess(res, { message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Return generic success to avoid email enumeration
    if (!user) {
      return sendSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;

    const sent = await sendEmail({
      to: user.email,
      subject: 'ProjAxis Password Reset Request',
      text: `Hello ${user.name},\n\nYou requested a password reset for your ProjAxis account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\nIf you did not request this, please ignore this email.`
    });

    if (!sent && env.NODE_ENV !== 'production') {
      logger.info(`[DEV PASSWORD RESET LINK] ${resetUrl}`);
    }

    return sendSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return sendError(res, 400, 'INVALID_RESET_TOKEN', 'Password reset token is invalid or has expired.');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;
    await user.save();

    await logActivity({
      actor: { userId: user._id, name: user.name, role: user.roles[0] },
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user.userId,
      description: `Password was reset using a valid token for user ${user.email}`
    });

    return sendSuccess(res, { message: 'Password has been reset successfully. You may now log in.' });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    return sendSuccess(res, { user, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};
