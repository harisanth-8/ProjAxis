import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  submitProgressReportSchema,
  updateProgressReportSchema,
  createFeedbackSchema,
  editFeedbackSchema,
  finalSubmissionSchema
} from '../validators/progressValidators.js';
import {
  submitProgressReport,
  getProjectProgressReports,
  updateProgressReport,
  createFeedback,
  getFeedbackForTarget,
  editFeedback,
  submitFinalProject
} from '../controllers/progressController.js';

const router = express.Router();

router.use(['/projects', '/progress-reports', '/feedback'], authenticate);

// Progress reports
router.post('/projects/:projectId/progress-reports', validate(submitProgressReportSchema), submitProgressReport);
router.get('/projects/:projectId/progress-reports', getProjectProgressReports);
router.put('/progress-reports/:id', validate(updateProgressReportSchema), updateProgressReport);

// Feedback
router.post('/feedback', validate(createFeedbackSchema), createFeedback);
router.get('/feedback', getFeedbackForTarget);
router.put('/feedback/:id', validate(editFeedbackSchema), editFeedback);

// Final submission (S4)
router.post('/projects/:id/final-submit', validate(finalSubmissionSchema), submitFinalProject);
router.post('/projects/:id/final-submission', validate(finalSubmissionSchema), submitFinalProject);

export default router;
