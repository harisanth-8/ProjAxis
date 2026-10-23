import { z } from 'zod';

export const submitProgressReportSchema = z.object({
  body: z.object({
    weekNo: z.number().int().min(1, 'Week number must be at least 1'),
    workDone: z.string().min(10, 'Work done description must be at least 10 characters').trim(),
    plannedNext: z.string().min(10, 'Planned next steps must be at least 10 characters').trim(),
    blockers: z.string().trim().optional(),
    progress: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
    remarks: z.string().trim().optional(),
    attachmentDocumentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional().default([])
  })
});

export const updateProgressReportSchema = z.object({
  body: z.object({
    workDone: z.string().min(10).trim().optional(),
    plannedNext: z.string().min(10).trim().optional(),
    blockers: z.string().trim().optional(),
    progress: z.number().min(0).max(100).optional(),
    remarks: z.string().trim().optional(),
    attachmentDocumentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
  })
});

export const createFeedbackSchema = z.object({
  body: z.object({
    projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    proposalId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    targetType: z.enum(['Proposal', 'ProgressReport', 'Review', 'Document']),
    targetId: z.string().min(1, 'Target ID is required'),
    comments: z.string().min(3, 'Comments must be at least 3 characters').trim(),
    reportStatus: z.enum(['Reviewed', 'Needs Attention']).optional()
  })
});

export const editFeedbackSchema = z.object({
  body: z.object({
    comments: z.string().min(3, 'Comments must be at least 3 characters').trim()
  })
});

export const finalSubmissionSchema = z.object({
  body: z.object({
    finalTitle: z.string().min(5, 'Final title is required').trim(),
    finalAbstract: z.string().min(20, 'Final abstract must be comprehensive').trim(),
    technologiesUsed: z.array(z.string().trim()).min(1, 'List at least one technology used'),
    repositoryUrl: z.string().url('Invalid repository URL').trim()
  })
});
