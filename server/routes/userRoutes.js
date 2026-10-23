import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createUserSchema,
  updateUserSchema,
  queryUsersSchema
} from '../validators/userValidators.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  getAvailableGuides
} from '../controllers/userController.js';

const router = express.Router();

router.use(authenticate);

// List available guides (accessible by student for mentor choices, HOD for allocation, Admin)
router.get('/guides', getAvailableGuides);

// User management (Admin & HOD read access)
router.get('/', requireRole('admin', 'hod'), validate(queryUsersSchema), getUsers);
router.post('/', requireRole('admin'), validate(createUserSchema), createUser);
router.get('/:id', requireRole('admin', 'hod'), getUserById);
router.put('/:id', requireRole('admin'), validate(updateUserSchema), updateUser);
router.patch('/:id', requireRole('admin'), validate(updateUserSchema), updateUser);

export default router;
