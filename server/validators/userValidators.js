import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    roles: z.array(z.enum(['student', 'guide', 'hod', 'panel', 'admin'])).min(1, 'At least one role is required'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID').optional().nullable(),
    temporaryPassword: z.string().min(6).optional(),
    phone: z.string().trim().optional(),
    // Profiles
    student: z.object({
      regNo: z.string().trim(),
      semester: z.number().int().min(1).max(8)
    }).optional(),
    guide: z.object({
      facultyId: z.string().trim()
    }).optional(),
    hod: z.object({
      hodId: z.string().trim()
    }).optional(),
    panel: z.object({
      panelId: z.string().trim(),
      designation: z.string().trim().optional()
    }).optional()
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid User ID')
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    roles: z.array(z.enum(['student', 'guide', 'hod', 'panel', 'admin'])).min(1).optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    accountStatus: z.enum(['Active', 'Pending Approval', 'Inactive']).optional(),
    phone: z.string().trim().optional()
  })
});

export const queryUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    role: z.enum(['student', 'guide', 'hod', 'panel', 'admin']).optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    accountStatus: z.enum(['Active', 'Pending Approval', 'Inactive']).optional(),
    q: z.string().optional()
  })
});
