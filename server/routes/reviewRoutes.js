import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  scheduleReviewSchema,
  rescheduleReviewSchema,
  recordAttendanceSchema,
  submitPanelScoreSchema,
  unlockEvaluationSchema
} from '../validators/reviewValidators.js';
import {
  scheduleReview,
  getReviews,
  getReviewById,
  rescheduleReview,
  cancelReview,
  recordAttendance,
  getStudentAttendanceSummary,
  submitPanelScore,
  publishEvaluation,
  unlockEvaluation,
  assignPanel,
  getEvaluations,
  getReviewEvaluation
} from '../controllers/reviewController.js';

const router = express.Router();

router.use(['/reviews', '/students', '/evaluations'], authenticate);

// Reviews
router.get('/reviews', getReviews);
router.post('/reviews', validate(scheduleReviewSchema), scheduleReview);
router.get('/reviews/:id', getReviewById);
router.get('/reviews/:id/evaluation', getReviewEvaluation);
router.patch('/reviews/:id/assign-panel', requireRole('hod', 'admin'), assignPanel);
router.put('/reviews/:id/reschedule', validate(rescheduleReviewSchema), rescheduleReview);
router.put('/reviews/:id/cancel', cancelReview);

// Attendance
router.post('/reviews/:id/attendance', validate(recordAttendanceSchema), recordAttendance);
router.get('/students/:studentId/attendance', getStudentAttendanceSummary);

// Evaluations & Marks
router.get('/evaluations', getEvaluations);
router.post('/evaluations/:id/score', validate(submitPanelScoreSchema), submitPanelScore);
router.post('/evaluations/:id/submit', submitPanelScore);
router.post('/evaluations/:id/publish', requireRole('hod', 'admin'), publishEvaluation);
router.post('/evaluations/:id/unlock', requireRole('admin'), validate(unlockEvaluationSchema), unlockEvaluation);

export default router;
