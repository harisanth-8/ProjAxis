import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProposalSchema,
  updateProposalSchema,
  assignGuideSchema,
  guideDecisionSchema,
  hodTopicApprovalSchema
} from '../validators/proposalValidators.js';
import {
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  submitProposal,
  assignGuide,
  guideDecision,
  hodTopicApproval,
  resubmitProposal
} from '../controllers/proposalController.js';

const router = express.Router();

router.use(authenticate);

// Student actions
router.post('/', requireRole('student', 'admin'), validate(createProposalSchema), createProposal);
router.get('/', getProposals);
router.get('/:id', getProposalById);
router.put('/:id', validate(updateProposalSchema), updateProposal);
router.post('/:id/submit', submitProposal);
router.post('/:id/resubmit', resubmitProposal);

// HOD & Admin guide allocation
router.post('/:id/assign-guide', requireRole('hod', 'admin'), validate(assignGuideSchema), assignGuide);

// Guide decision
router.post('/:id/guide-decision', requireRole('guide', 'admin'), validate(guideDecisionSchema), guideDecision);

// HOD final topic approval
router.post('/:id/topic-approval', requireRole('hod', 'admin'), validate(hodTopicApprovalSchema), hodTopicApproval);
router.post('/:id/hod-decision', requireRole('hod', 'admin'), validate(hodTopicApprovalSchema), hodTopicApproval);

export default router;
