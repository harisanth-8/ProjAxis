import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().trim().optional(),
    role: z.enum(['student', 'guide', 'hod']),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID'),
    // Role specific
    regNo: z.string().trim().optional(),
    semester: z.number().int().min(1).max(8).optional(),
    facultyId: z.string().trim().optional(),
    hodId: z.string().trim().optional()
  }).refine((data) => {
    if (data.role === 'student' && (!data.regNo || !data.semester)) {
      return false;
    }
    if (data.role === 'guide' && !data.facultyId) {
      return false;
    }
    if (data.role === 'hod' && !data.hodId) {
      return false;
    }
    return true;
  }, {
    message: 'Required role-specific fields (e.g. regNo/semester, facultyId, or hodId) are missing'
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').trim().toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters')
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).trim().optional(),
    phone: z.string().trim().optional(),
    profileImage: z.string().url().or(z.string().length(0)).optional()
  })
});
