import { z } from 'zod';

export const scheduleReviewSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    reviewType: z.string().min(1, 'Review type is required'),
    reviewDate: z.string().min(1, 'Review date is required').refine((date) => !isNaN(new Date(date).getTime()), {
      message: 'Invalid review date'
    }),
    venue: z.string().min(2, 'Venue is required').trim(),
    instructions: z.string().trim().optional(),
    panelMemberIds: z.array(z.string().min(1)).optional().default([])
  })
});

export const rescheduleReviewSchema = z.object({
  body: z.object({
    reviewDate: z.string().min(1, 'New review date is required').refine((date) => !isNaN(new Date(date).getTime()), {
      message: 'Invalid review date'
    }),
    venue: z.string().min(2, 'Venue is required').trim(),
    reason: z.string().min(3, 'Reschedule reason is required').trim(),
    panelMemberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
  })
});

export const recordAttendanceSchema = z.object({
  body: z.object({
    records: z.array(z.object({
      studentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
      status: z.enum(['Present', 'Absent', 'Excused']),
      note: z.string().trim().optional()
    })).min(1, 'At least one student attendance record required'),
    reason: z.string().trim().optional() // required if editing existing attendance
  })
});

export const submitPanelScoreSchema = z.object({
  body: z.object({
    studentEvaluations: z.array(z.object({
      studentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
      scores: z.array(z.object({
        criterionIndex: z.number().int().min(0),
        criterion: z.string().min(1),
        marks: z.number().min(0)
      })),
      comments: z.string().trim().optional()
    })).min(1, 'Evaluations for student(s) required')
  })
});

export const unlockEvaluationSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'A detailed reason is required to unlock published evaluations').trim()
  })
});
