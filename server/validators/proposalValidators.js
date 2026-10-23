import { z } from 'zod';

export const createProposalSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').trim(),
    domain: z.string().min(2, 'Domain is required').trim(),
    description: z.string().trim().optional(),
    problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters').trim(),
    objectives: z.string().min(10, 'Objectives must be at least 10 characters').trim(),
    methodology: z.string().min(10, 'Methodology must be at least 10 characters').trim(),
    expectedOutcome: z.string().min(10, 'Expected outcome must be at least 10 characters').trim(),
    mentorChoices: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID')).max(3, 'Up to 3 mentor choices').optional().default([]),
    studentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID')).min(1, 'At least 1 student required').max(4, 'At most 4 students per team').optional()
  })
});

export const updateProposalSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Proposal ID is required')
  }),
  body: z.object({
    title: z.string().min(5).trim().optional(),
    domain: z.string().min(2).trim().optional(),
    description: z.string().trim().optional(),
    problemStatement: z.string().min(10).trim().optional(),
    objectives: z.string().min(10).trim().optional(),
    methodology: z.string().min(10).trim().optional(),
    expectedOutcome: z.string().min(10).trim().optional(),
    mentorChoices: z.array(z.string().min(1)).max(3).optional(),
    studentIds: z.array(z.string().min(1)).min(1).max(4).optional()
  })
});

export const assignGuideSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Proposal ID is required')
  }),
  body: z.object({
    guideId: z.string().min(1, 'Guide ID is required'),
    overrideCapacityCap: z.boolean().optional().default(false),
    overrideReason: z.string().trim().optional()
  }).refine((data) => {
    if (data.overrideCapacityCap && !data.overrideReason) {
      return false;
    }
    return true;
  }, {
    message: 'An override reason is required when bypassing the guide capacity cap'
  })
});

export const guideDecisionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Proposal ID is required')
  }),
  body: z.object({
    decision: z.enum(['Approve', 'Reject', 'Request Revision']),
    comments: z.string().trim().optional()
  }).refine((data) => {
    if ((data.decision === 'Reject' || data.decision === 'Request Revision') && (!data.comments || data.comments.length < 5)) {
      return false;
    }
    return true;
  }, {
    message: 'Comments/reasons are required when rejecting or requesting revisions'
  })
});

export const hodTopicApprovalSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Proposal ID is required')
  }),
  body: z.object({
    decision: z.enum(['Approved', 'Rejected', 'Revision Required']),
    comments: z.string().trim().optional()
  }).refine((data) => {
    if ((data.decision === 'Rejected' || data.decision === 'Revision Required') && (!data.comments || data.comments.length < 5)) {
      return false;
    }
    return true;
  }, {
    message: 'Comments/reasons are required when rejecting or requesting revisions'
  })
});
