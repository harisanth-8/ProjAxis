import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getProjectStatusReport,
  getTaskCompletionReport,
  getGuideWorkloadReport,
  getProposalPipelineReport,
  getWeeklyComplianceReport,
  getMarksSheetReport
} from '../controllers/reportController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('hod', 'admin'));

router.get('/project-status', getProjectStatusReport);
router.get('/task-completion', getTaskCompletionReport);
router.get('/tasks-completion', getTaskCompletionReport);
router.get('/guide-workload', getGuideWorkloadReport);
router.get('/proposal-pipeline', getProposalPipelineReport);
router.get('/weekly-compliance', getWeeklyComplianceReport);
router.get('/marks-sheet', getMarksSheetReport);

export default router;

