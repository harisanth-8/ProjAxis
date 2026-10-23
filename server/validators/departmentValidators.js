import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name is required').trim(),
    code: z.string().min(2, 'Department code is required').trim().toUpperCase(),
    description: z.string().trim().optional()
  })
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID')
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    code: z.string().min(2).trim().toUpperCase().optional(),
    description: z.string().trim().optional()
  })
});
