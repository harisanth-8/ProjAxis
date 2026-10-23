import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  addTaskCommentSchema,
  createWorkstreamSchema,
  updateWorkstreamSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createCalendarEventSchema
} from '../validators/taskValidators.js';
import {
  getProjects,
  getProjectById,
  updateProjectStatus,
  getProjectTasks,
  createTask,
  updateTask,
  addTaskComment,
  getWorkstreams,
  createWorkstream,
  updateWorkstream,
  getMilestones,
  createMilestone,
  updateMilestone,
  getProjectSummary,
  getTeamWorkload,
  getCalendarEvents,
  createCalendarEvent,
  getProjectActivity
} from '../controllers/workspaceController.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { getDocuments, uploadDocument } from '../controllers/documentController.js';

const router = express.Router();

router.use(['/projects', '/tasks', '/workstreams', '/milestones', '/calendar'], authenticate);

// Projects
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectById);
router.put('/projects/:id/status', updateProjectStatus);
router.patch('/projects/:id/status', updateProjectStatus);

// Project Workspace Views
router.get('/projects/:projectId/summary', getProjectSummary);
router.get('/projects/:projectId/workload', getTeamWorkload);
router.get('/projects/:projectId/activity', getProjectActivity);
router.get('/projects/:projectId/documents', getDocuments);
router.post('/projects/:projectId/documents', uploadMiddleware.single('file'), uploadDocument);

// Tasks
router.get('/projects/:projectId/tasks', getProjectTasks);
router.post('/projects/:projectId/tasks', validate(createTaskSchema), createTask);
router.put('/tasks/:id', validate(updateTaskSchema), updateTask);
router.patch('/tasks/:id', validate(updateTaskSchema), updateTask);
router.patch('/tasks/:id/status', validate(updateTaskSchema), updateTask);
router.patch('/projects/:projectId/tasks/:id/status', validate(updateTaskSchema), updateTask);
router.patch('/projects/:projectId/tasks/:id', validate(updateTaskSchema), updateTask);
router.put('/projects/:projectId/tasks/:id', validate(updateTaskSchema), updateTask);
router.post('/tasks/:id/comments', validate(addTaskCommentSchema), addTaskComment);

// Workstreams
router.get('/projects/:projectId/workstreams', getWorkstreams);
router.post('/projects/:projectId/workstreams', validate(createWorkstreamSchema), createWorkstream);
router.put('/workstreams/:id', validate(updateWorkstreamSchema), updateWorkstream);
router.patch('/workstreams/:id', validate(updateWorkstreamSchema), updateWorkstream);
router.patch('/projects/:projectId/workstreams/:id', validate(updateWorkstreamSchema), updateWorkstream);
router.put('/projects/:projectId/workstreams/:id', validate(updateWorkstreamSchema), updateWorkstream);

// Milestones
router.get('/projects/:projectId/milestones', getMilestones);
router.post('/projects/:projectId/milestones', validate(createMilestoneSchema), createMilestone);
router.put('/milestones/:id', validate(updateMilestoneSchema), updateMilestone);
router.patch('/milestones/:id', validate(updateMilestoneSchema), updateMilestone);
router.patch('/projects/:projectId/milestones/:id', validate(updateMilestoneSchema), updateMilestone);
router.put('/projects/:projectId/milestones/:id', validate(updateMilestoneSchema), updateMilestone);

// Calendar
router.get('/calendar', getCalendarEvents);
router.get('/calendar/events', getCalendarEvents);
router.post('/calendar', validate(createCalendarEventSchema), createCalendarEvent);
router.post('/calendar/events', validate(createCalendarEventSchema), createCalendarEvent);

export default router;
