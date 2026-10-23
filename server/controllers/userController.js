import User from '../models/User.js';
import Department from '../models/Department.js';
import Project from '../models/Project.js';
import Settings from '../models/Settings.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../models/ActivityLog.js';

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, departmentId, accountStatus, q } = req.query;
    const filter = {};

    if (role) filter.roles = role;
    if (departmentId) filter.departmentId = departmentId;
    if (accountStatus) filter.accountStatus = accountStatus;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { userId: { $regex: q, $options: 'i' } },
        { 'student.regNo': { $regex: q, $options: 'i' } },
        { 'guide.facultyId': { $regex: q, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendSuccess(res, users, 200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    let user;
    if (req.params.id?.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(req.params.id).populate('departmentId', 'name code description');
    }
    if (!user) {
      user = await User.findOne({ userId: req.params.id }).populate('departmentId', 'name code description');
    }
    if (!user) {
      return sendError(res, 404, 'NOT_FOUND', 'User not found');
    }
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, roles, departmentId, temporaryPassword, phone, student, guide, hod, panel } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'DUPLICATE_EMAIL', 'An account with this email address already exists');
    }

    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept) {
        return sendError(res, 404, 'NOT_FOUND', 'Department not found');
      }
    }

    const seq = await getNextSequence('user');
    const userId = `USR-${String(seq).padStart(4, '0')}`;
    const initialPassword = temporaryPassword || 'ChangeMe@123';
    const passwordHash = await User.hashPassword(initialPassword);

    const newUser = await User.create({
      userId,
      name,
      email,
      passwordHash,
      phone: phone || '',
      roles,
      departmentId: departmentId || null,
      accountStatus: 'Active',
      mustChangePassword: true, // Temporary password requires password change at first login
      student,
      guide,
      hod,
      panel
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'ADMIN_CREATED_USER',
      entity: 'User',
      entityId: newUser.userId,
      description: `Admin created user ${newUser.email} with roles [${roles.join(', ')}]`
    });

    return sendSuccess(res, newUser, 201);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, roles, departmentId, accountStatus, phone } = req.body;
    let user;
    if (req.params.id?.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(req.params.id);
    }
    if (!user) {
      user = await User.findOne({ userId: req.params.id });
    }

    if (!user) {
      return sendError(res, 404, 'NOT_FOUND', 'User not found');
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (roles) user.roles = roles;
    if (departmentId !== undefined) user.departmentId = departmentId;

    if (accountStatus && accountStatus !== user.accountStatus) {
      const oldStatus = user.accountStatus;
      user.accountStatus = accountStatus;

      // If approved from pending, notify user
      if (oldStatus === 'Pending Approval' && accountStatus === 'Active') {
        await createNotification({
          recipientId: user._id,
          category: 'System',
          message: 'Your ProjAxis faculty account has been approved by the administrator. You may now log in.',
          sendEmailNotification: true
        });
      }
    }

    await user.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'ADMIN_UPDATED_USER',
      entity: 'User',
      entityId: user.userId,
      description: `Admin updated user ${user.email} (Status: ${user.accountStatus})`
    });

    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};

export const getAvailableGuides = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const filter = {
      roles: 'guide',
      accountStatus: 'Active'
    };
    if (departmentId) filter.departmentId = departmentId;

    const guides = await User.find(filter).populate('departmentId', 'name code');
    const settings = await Settings.findOne() || { guideCapacityCap: 8 };

    // Calculate active project count for each guide
    const guideWorkloads = await Promise.all(
      guides.map(async (guide) => {
        const activeCount = await Project.countDocuments({
          guideId: guide._id,
          status: { $in: ['Active', 'On Hold', 'Final Submitted', 'Under Evaluation'] }
        });

        return {
          _id: guide._id,
          userId: guide.userId,
          name: guide.name,
          email: guide.email,
          facultyId: guide.guide?.facultyId || '',
          department: guide.departmentId,
          activeProjectCount: activeCount,
          capacityCap: settings.guideCapacityCap,
          hasCapacity: activeCount < settings.guideCapacityCap
        };
      })
    );

    return sendSuccess(res, guideWorkloads);
  } catch (err) {
    next(err);
  }
};
