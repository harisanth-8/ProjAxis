import Department from '../models/Department.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../models/ActivityLog.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return sendSuccess(res, departments);
  } catch (err) {
    next(err);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendError(res, 404, 'NOT_FOUND', 'Department not found');
    }
    return sendSuccess(res, department);
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    const existingCode = await Department.findOne({ code });
    if (existingCode) {
      return sendError(res, 409, 'DUPLICATE_CODE', 'A department with this code already exists');
    }

    const dept = await Department.create({ name, code, description });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'ADMIN_CREATED_DEPARTMENT',
      entity: 'Department',
      entityId: dept._id.toString(),
      description: `Created department ${dept.name} (${dept.code})`
    });

    return sendSuccess(res, dept, 201);
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      return sendError(res, 404, 'NOT_FOUND', 'Department not found');
    }

    if (code && code !== dept.code) {
      const existing = await Department.findOne({ code, _id: { $ne: dept._id } });
      if (existing) {
        return sendError(res, 409, 'DUPLICATE_CODE', 'A department with this code already exists');
      }
      dept.code = code;
    }

    if (name) dept.name = name;
    if (description !== undefined) dept.description = description;

    await dept.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'ADMIN_UPDATED_DEPARTMENT',
      entity: 'Department',
      entityId: dept._id.toString(),
      description: `Updated department ${dept.name} (${dept.code})`
    });

    return sendSuccess(res, dept);
  } catch (err) {
    next(err);
  }
};
