import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema
} from '../validators/departmentValidators.js';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment
} from '../controllers/departmentController.js';

const router = express.Router();

// Publicly readable for registration dropdowns, but protected operations for admins
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

router.post('/', authenticate, requireRole('admin'), validate(createDepartmentSchema), createDepartment);
router.put('/:id', authenticate, requireRole('admin'), validate(updateDepartmentSchema), updateDepartment);
router.patch('/:id', authenticate, requireRole('admin'), validate(updateDepartmentSchema), updateDepartment);

export default router;
