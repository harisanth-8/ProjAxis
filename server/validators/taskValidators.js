import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title is required').trim(),
    description: z.string().trim().optional(),
    assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Assignee ID').optional().nullable(),
    priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional().default('Medium'),
    status: z.enum(['To Do', 'In Progress', 'Under Review', 'Blocked', 'Done']).optional().default('To Do'),
    startDate: z.string().datetime().or(z.string().length(0)).optional().nullable(),
    dueDate: z.string().datetime().or(z.string().length(0)).optional().nullable(),
    workstreamId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    milestoneId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    dependsOn: z.array(z.string()).optional().default([]),
    attachmentDocumentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional().default([])
  })
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Task ID')
  }),
  body: z.object({
    title: z.string().min(2).trim().optional(),
    description: z.string().trim().optional(),
    assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional(),
    status: z.enum(['To Do', 'In Progress', 'Under Review', 'Blocked', 'Done']).optional(),
    startDate: z.string().datetime().or(z.string().length(0)).optional().nullable(),
    dueDate: z.string().datetime().or(z.string().length(0)).optional().nullable(),
    workstreamId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    milestoneId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    dependsOn: z.array(z.string()).optional(),
    attachmentDocumentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
  })
});

export const addTaskCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Task ID')
  }),
  body: z.object({
    text: z.string().min(1, 'Comment text is required').trim()
  })
});

export const createWorkstreamSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Workstream title is required').trim(),
    description: z.string().trim().optional(),
    order: z.number().int().optional().default(1)
  })
});

export const updateWorkstreamSchema = z.object({
  body: z.object({
    title: z.string().min(2).trim().optional(),
    description: z.string().trim().optional(),
    order: z.number().int().optional(),
    status: z.enum(['Open', 'Completed']).optional()
  })
});

export const createMilestoneSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Milestone title is required').trim(),
    description: z.string().trim().optional(),
    dueDate: z.string().min(1, 'Due date is required')
  })
});

export const updateMilestoneSchema = z.object({
  body: z.object({
    title: z.string().min(2).trim().optional(),
    description: z.string().trim().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['Pending', 'Achieved', 'Missed']).optional()
  })
});

export const createCalendarEventSchema = z.object({
  body: z.object({
    projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    title: z.string().min(2, 'Title is required').trim(),
    description: z.string().trim().optional(),
    eventType: z.enum(['Meeting', 'Presentation', 'Deadline', 'Review', 'Other']).default('Meeting'),
    startAt: z.string().min(1, 'Start time is required'),
    endAt: z.string().min(1, 'End time is required'),
    participantIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional().default([])
  }).refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: 'End date and time must be strictly after the start date and time'
  })
});
