import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Workstream from '../models/Workstream.js';
import Milestone from '../models/Milestone.js';
import ProgressReport from '../models/ProgressReport.js';
import Review from '../models/Review.js';
import Evaluation from '../models/Evaluation.js';
import CalendarEvent from '../models/CalendarEvent.js';
import ActivityLog, { logActivity } from '../models/ActivityLog.js';
import User from '../models/User.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

export const resolveProjectId = async (idParam) => {
  if (!idParam) return null;
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const p = await Project.findById(idParam);
    if (p) return p;
  }
  return await Project.findOne({ projectId: idParam });
};

// --- Projects ---

export const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, departmentId, academicYear, q } = req.query;
    const filter = {};

    if (req.user.roles.includes('admin')) {
      // Admin sees all
    } else if (req.user.roles.includes('hod')) {
      filter.departmentId = req.user.departmentId;
    } else if (req.user.roles.includes('guide')) {
      filter.guideId = req.user._id;
    } else if (req.user.roles.includes('student')) {
      filter.studentIds = req.user._id;
    } else if (req.user.roles.includes('panel')) {
      const assignedReviews = await Review.find({ panelMemberIds: req.user._id });
      const projectIds = assignedReviews.map((r) => r.projectId);
      filter._id = { $in: projectIds };
    }

    if (status) filter.status = status;
    if (departmentId) filter.departmentId = departmentId;
    if (academicYear) filter.academicYear = academicYear;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { projectId: { $regex: q, $options: 'i' } },
        { domain: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('studentIds', 'name email userId student.regNo')
      .populate('guideId', 'name email userId guide.facultyId')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Compute progress figures for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const doneTasks = await Task.countDocuments({ projectId: p._id, status: 'Done' });

        const taskProgress = totalTasks === 0 ? 'No tasks yet' : `${Math.round((doneTasks / totalTasks) * 100)}%`;

        const latestReport = await ProgressReport.findOne({ projectId: p._id }).sort({ weekNo: -1 });
        const reportedProgress = latestReport ? `${latestReport.progress}%` : '0%';

        const tasks = await Task.find({ projectId: p._id })
          .populate('assigneeId', 'name email userId student.regNo')
          .sort({ createdAt: -1 });

        const pObj = p.toObject();
        pObj.tasks = tasks;
        pObj.students = pObj.studentIds;
        pObj.guide = pObj.guideId;
        pObj.latestReportProgress = latestReport ? latestReport.progress : 0;
        pObj.computedMetrics = {
          taskProgress,
          doneTasks,
          totalTasks,
          reportedProgress
        };
        return pObj;
      })
    );

    return sendSuccess(res, projectsWithProgress, 200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    let project;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      project = await Project.findById(req.params.id)
        .populate('studentIds', 'name email userId phone student.regNo student.semester')
        .populate('guideId', 'name email userId phone guide.facultyId')
        .populate('departmentId', 'name code description')
        .populate('proposalId');
    }
    if (!project) {
      project = await Project.findOne({ projectId: req.params.id })
        .populate('studentIds', 'name email userId phone student.regNo student.semester')
        .populate('guideId', 'name email userId phone guide.facultyId')
        .populate('departmentId', 'name code description')
        .populate('proposalId');
    }

    if (!project) {
      return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    }

    // Permission check
    const isMember = project.studentIds.some((s) => s._id.toString() === req.user._id.toString());
    const isGuide = project.guideId._id.toString() === req.user._id.toString();
    const isDeptHod = req.user.roles.includes('hod') && req.user.departmentId && project.departmentId && req.user.departmentId.toString() === project.departmentId._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    let isPanel = false;
    if (req.user.roles.includes('panel')) {
      const rev = await Review.findOne({ projectId: project._id, panelMemberIds: req.user._id });
      isPanel = !!rev;
    }

    if (!isMember && !isGuide && !isDeptHod && !isAdmin && !isPanel) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied to this project');
    }

    const totalTasks = await Task.countDocuments({ projectId: project._id });
    const doneTasks = await Task.countDocuments({ projectId: project._id, status: 'Done' });
    const taskProgress = totalTasks === 0 ? 'No tasks yet' : `${Math.round((doneTasks / totalTasks) * 100)}%`;

    const latestReport = await ProgressReport.findOne({ projectId: project._id }).sort({ weekNo: -1 });
    const reportedProgress = latestReport ? `${latestReport.progress}%` : '0%';

    const tasks = await Task.find({ projectId: project._id })
      .populate('assigneeId', 'name email userId student.regNo')
      .populate('workstreamId', 'title workstreamId')
      .populate('milestoneId', 'title milestoneId dueDate status')
      .sort({ createdAt: -1 });

    const workstreams = await Workstream.find({ projectId: project._id }).sort({ order: 1 });
    const milestones = await Milestone.find({ projectId: project._id }).sort({ dueDate: 1 });

    const pObj = project.toObject();
    pObj.tasks = tasks;
    pObj.workstreams = workstreams;
    pObj.milestones = milestones;
    pObj.students = pObj.studentIds;
    pObj.guide = pObj.guideId;
    pObj.computedMetrics = {
      taskProgress,
      doneTasks,
      totalTasks,
      reportedProgress
    };

    return sendSuccess(res, pObj);
  } catch (err) {
    next(err);
  }
};

export const updateProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    }

    // "Completed is set by the HOD (or admin) only after the final evaluation is Published."
    if (status === 'Completed') {
      const isHod = req.user.roles.includes('hod') && req.user.departmentId.toString() === project.departmentId.toString();
      const isAdmin = req.user.roles.includes('admin');
      if (!isHod && !isAdmin) {
        return sendError(res, 403, 'FORBIDDEN', 'Only HOD or Admin can mark a project as Completed');
      }

      // Find final viva review and published evaluation
      const finalReview = await Review.findOne({ projectId: project._id, reviewType: 'Final Viva' });
      if (!finalReview) {
        return sendError(res, 409, 'MISSING_FINAL_VIVA', 'Project cannot be marked Completed without a Final Viva review');
      }

      const evaluation = await Evaluation.findOne({ reviewId: finalReview._id });
      if (!evaluation || evaluation.status !== 'Published') {
        return sendError(res, 409, 'EVALUATION_NOT_PUBLISHED', 'Project cannot be marked Completed until the Final Viva evaluation is Published');
      }

      project.completedAt = new Date();
    }

    // Guide or HOD or Admin can update other statuses (On Hold, Active, Cancelled)
    const isGuide = project.guideId.toString() === req.user._id.toString();
    const isHod = req.user.roles.includes('hod') && req.user.departmentId.toString() === project.departmentId.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only Guide, HOD, or Admin can update project status');
    }

    const previousStatus = project.status;
    project.status = status;
    await project.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PROJECT_STATUS_UPDATED',
      entity: 'Project',
      entityId: project.projectId,
      projectId: project._id,
      description: `Project status transitioned from '${previousStatus}' to '${status}'`
    });

    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
};

// --- Tasks ---

export const getProjectTasks = async (req, res, next) => {
  try {
    const project = await resolveProjectId(req.params.projectId);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found');

    const { status, assigneeId, priority, workstreamId, milestoneId, unscheduled, q } = req.query;

    const filter = { projectId: project._id };

    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (priority) filter.priority = priority;
    if (workstreamId) filter.workstreamId = workstreamId;
    if (milestoneId) filter.milestoneId = milestoneId;

    if (unscheduled === 'true') {
      filter.$or = [{ startDate: null }, { dueDate: null }];
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { taskId: { $regex: q, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name email userId student.regNo')
      .populate('createdBy', 'name email userId roles')
      .populate('workstreamId', 'title workstreamId')
      .populate('milestoneId', 'title milestoneId dueDate status')
      .populate('attachmentDocumentIds', 'fileName storedFilename fileType size')
      .sort({ createdAt: -1 });

    return sendSuccess(res, tasks);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const project = await resolveProjectId(req.params.projectId);

    if (!project) {
      return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    }

    const isMember = project.studentIds.some((s) => s.toString() === req.user._id.toString());
    const isGuide = project.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isMember && !isGuide && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only project team members, guide, or admin can create tasks');
    }

    const { title, description, assigneeId, priority, status, startDate, dueDate, workstreamId, milestoneId, dependsOn, attachmentDocumentIds } = req.body;

    // Validate assignee belongs to the team
    if (assigneeId) {
      const isTeamAssignee = project.studentIds.some((s) => s.toString() === assigneeId.toString());
      if (!isTeamAssignee) {
        return sendError(res, 400, 'INVALID_ASSIGNEE', 'Assignee must be a member of the project student team');
      }
    }

    // If student creating, status cannot be Done
    if (!isGuide && !isAdmin && status === 'Done') {
      return sendError(res, 403, 'FORBIDDEN', 'Only guide or admin can create or mark a task as Done');
    }

    const seq = await getNextSequence(`task-${project._id}`);
    const taskId = `TSK-${String(seq).padStart(4, '0')}`;

    const task = await Task.create({
      taskId,
      projectId: project._id,
      title,
      description: description || '',
      assigneeId: assigneeId || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      status: status || 'To Do',
      startDate: startDate || null,
      dueDate: dueDate || null,
      workstreamId: workstreamId || null,
      milestoneId: milestoneId || null,
      dependsOn: dependsOn || [],
      attachmentDocumentIds: attachmentDocumentIds || []
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: task.taskId,
      projectId: project._id,
      description: `Task "${task.title}" created with priority ${task.priority}`
    });

    if (assigneeId && assigneeId.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId: assigneeId,
        category: 'Task',
        message: `You were assigned to task "${task.title}" (ID: ${task.taskId}) in project "${project.title}".`,
        relatedEntityType: 'Task',
        relatedEntityId: task._id.toString()
      });
    }

    return sendSuccess(res, task, 201);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    const project = await Project.findById(task.projectId);
    const isStudent = req.user.roles.includes('student');
    const isAssignedStudent = task.assigneeId && task.assigneeId.toString() === req.user._id.toString();
    const isGuide = project && project.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    const { title, description, assigneeId, priority, status, startDate, dueDate, workstreamId, milestoneId, dependsOn, attachmentDocumentIds } = req.body;

    // Validate state transitions
    if (status && status !== task.status) {
      const current = task.status;
      const target = status;

      // "Task transitions: To Do, In Progress, Under Review, Done. Blocked is reachable from To Do or In Progress and returns to either."
      // "Students may set To Do, In Progress, Under Review or Blocked on tasks assigned to them."
      // "Only the guide or admin may set Done or send a task from Under Review back to In Progress. Invalid transitions return 409."

      if (target === 'Done' && !isGuide && !isAdmin) {
        return sendError(res, 409, 'INVALID_TRANSITION', 'Only the guide or admin can mark a task as Done');
      }

      if (current === 'Under Review' && target === 'In Progress' && !isGuide && !isAdmin) {
        return sendError(res, 409, 'INVALID_TRANSITION', 'Only the guide or admin can send a task from Under Review back to In Progress');
      }

      if (isStudent && !isAssignedStudent && !isAdmin) {
        return sendError(res, 403, 'FORBIDDEN', 'Students can only update status on tasks assigned to them');
      }

      // Check transition validity
      let valid = false;

      if (current === 'To Do' && ['In Progress', 'Blocked'].includes(target)) valid = true;
      else if (current === 'In Progress' && ['Under Review', 'Blocked', 'To Do', 'Done'].includes(target)) valid = true;
      else if (current === 'Blocked' && ['To Do', 'In Progress'].includes(target)) valid = true;
      else if (current === 'Under Review' && ['Done', 'In Progress'].includes(target)) valid = true;
      else if (current === 'Done' && (isGuide || isAdmin)) valid = true; // Guide/admin can reopen

      if (!valid) {
        return sendError(res, 409, 'INVALID_TRANSITION', `Invalid status transition from '${current}' to '${target}'`);
      }

      task.status = target;
      if (target === 'Done') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }

    if (title && (isGuide || isAdmin || isAssignedStudent)) task.title = title;
    if (description !== undefined && (isGuide || isAdmin || isAssignedStudent)) task.description = description;
    if (assigneeId !== undefined && (isGuide || isAdmin)) task.assigneeId = assigneeId;
    if (priority && (isGuide || isAdmin)) task.priority = priority;
    if (startDate !== undefined && (isGuide || isAdmin)) task.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined && (isGuide || isAdmin)) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (workstreamId !== undefined && (isGuide || isAdmin)) task.workstreamId = workstreamId;
    if (milestoneId !== undefined && (isGuide || isAdmin)) task.milestoneId = milestoneId;
    if (dependsOn && (isGuide || isAdmin)) task.dependsOn = dependsOn;
    if (attachmentDocumentIds) task.attachmentDocumentIds = attachmentDocumentIds;

    await task.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'TASK_UPDATED',
      entity: 'Task',
      entityId: task.taskId,
      projectId: task.projectId,
      description: `Task "${task.title}" updated (Status: ${task.status})`
    });

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
};

export const addTaskComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, 404, 'NOT_FOUND', 'Task not found');
    }

    task.comments.push({
      author: req.user._id,
      text,
      at: new Date()
    });

    await task.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'TASK_COMMENT_ADDED',
      entity: 'Task',
      entityId: task.taskId,
      projectId: task.projectId,
      description: `Comment added to task "${task.title}"`
    });

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
};

// --- Workstreams & Milestones ---

export const getWorkstreams = async (req, res, next) => {
  try {
    const project = await resolveProjectId(req.params.projectId);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found');

    const workstreams = await Workstream.find({ projectId: project._id }).sort({ order: 1 });
    return sendSuccess(res, workstreams);
  } catch (err) {
    next(err);
  }
};

export const createWorkstream = async (req, res, next) => {
  try {
    const { title, description, order } = req.body;
    const project = await resolveProjectId(req.params.projectId);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found');

    const isGuide = project.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');
    if (!isGuide && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only guide or admin can create workstreams');
    }

    const seq = await getNextSequence(`workstream-${project._id}`);
    const workstreamId = `WKS-${String(seq).padStart(3, '0')}`;

    const workstream = await Workstream.create({
      workstreamId,
      projectId: project._id,
      title,
      description: description || '',
      order: order || 1,
      status: 'Open'
    });

    return sendSuccess(res, workstream, 201);
  } catch (err) {
    next(err);
  }
};

export const updateWorkstream = async (req, res, next) => {
  try {
    const workstream = await Workstream.findById(req.params.id);
    if (!workstream) return sendError(res, 404, 'NOT_FOUND', 'Workstream not found');

    const project = await Project.findById(workstream.projectId);
    const isGuide = project && project.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only guide or admin can manage workstreams');
    }

    const { title, description, order, status } = req.body;

    // "A workstream is Completed only when every task in it is Done and the guide marks it complete."
    if (status === 'Completed') {
      const openTasksCount = await Task.countDocuments({
        workstreamId: workstream._id,
        status: { $ne: 'Done' }
      });

      if (openTasksCount > 0) {
        return sendError(
          res,
          409,
          'TASKS_NOT_DONE',
          `Cannot mark workstream as Completed: ${openTasksCount} task(s) in this workstream are not Done yet`
        );
      }
    }

    if (title) workstream.title = title;
    if (description !== undefined) workstream.description = description;
    if (order !== undefined) workstream.order = order;
    if (status) workstream.status = status;

    await workstream.save();
    return sendSuccess(res, workstream);
  } catch (err) {
    next(err);
  }
};

export const getMilestones = async (req, res, next) => {
  try {
    const project = await resolveProjectId(req.params.projectId);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found');

    const milestones = await Milestone.find({ projectId: project._id }).sort({ dueDate: 1 });
    return sendSuccess(res, milestones);
  } catch (err) {
    next(err);
  }
};

export const createMilestone = async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;
    const project = await resolveProjectId(req.params.projectId);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found');

    const isGuide = project.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');
    if (!isGuide && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only guide or admin can create milestones');
    }

    const seq = await getNextSequence(`milestone-${project._id}`);
    const milestoneId = `MLS-${String(seq).padStart(3, '0')}`;

    const milestone = await Milestone.create({
      milestoneId,
      projectId: project._id,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      status: 'Pending'
    });

    return sendSuccess(res, milestone, 201);
  } catch (err) {
    next(err);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return sendError(res, 404, 'NOT_FOUND', 'Milestone not found');

    const project = await Project.findById(milestone.projectId);
    const isGuide = project && project.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only guide or admin can update milestones');
    }

    const { title, description, dueDate, status } = req.body;

    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (dueDate) milestone.dueDate = new Date(dueDate);

    if (status && status !== milestone.status) {
      milestone.status = status;
      if (status === 'Achieved') {
        milestone.achievedAt = new Date();
      }
    }

    await milestone.save();
    return sendSuccess(res, milestone);
  } catch (err) {
    next(err);
  }
};

// --- Summary & Metrics ---

export const getProjectSummary = async (req, res, next) => {
  try {
    const project = await resolveProjectId(req.params.projectId);
    if (!project) return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    const targetId = project._id;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Counters
    const completedLast7Days = await Task.countDocuments({
      projectId: targetId,
      status: 'Done',
      completedAt: { $gte: sevenDaysAgo }
    });

    const updatedLast7Days = await Task.countDocuments({
      projectId: targetId,
      updatedAt: { $gte: sevenDaysAgo }
    });

    const createdLast7Days = await Task.countDocuments({
      projectId: targetId,
      createdAt: { $gte: sevenDaysAgo }
    });

    const dueSoonNext7Days = await Task.countDocuments({
      projectId: targetId,
      status: { $ne: 'Done' },
      dueDate: { $gte: now, $lte: sevenDaysAhead }
    });

    // 2. Status distribution (donut)
    const statusDistribution = await Task.aggregate([
      { $match: { projectId: targetId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3. Priority breakdown (bar chart)
    const priorityBreakdown = await Task.aggregate([
      { $match: { projectId: targetId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // 4. Progress measures
    const totalTasks = await Task.countDocuments({ projectId: targetId });
    const doneTasks = await Task.countDocuments({ projectId: targetId, status: 'Done' });
    const taskProgress = totalTasks === 0 ? 'No tasks yet' : `${Math.round((doneTasks / totalTasks) * 100)}%`;

    const latestReport = await ProgressReport.findOne({ projectId: targetId }).sort({ weekNo: -1 });
    const reportedProgress = latestReport ? `${latestReport.progress}%` : '0%';

    // 5. Milestones progress
    const totalMilestones = await Milestone.countDocuments({ projectId: targetId });
    const achievedMilestones = await Milestone.countDocuments({ projectId: targetId, status: 'Achieved' });
    const milestoneProgress = totalMilestones === 0 ? 'No milestones' : `${Math.round((achievedMilestones / totalMilestones) * 100)}%`;

    // 6. Workstreams progress
    const workstreams = await Workstream.find({ projectId: targetId }).sort({ order: 1 });
    const workstreamMetrics = await Promise.all(
      workstreams.map(async (w) => {
        const total = await Task.countDocuments({ workstreamId: w._id });
        const done = await Task.countDocuments({ workstreamId: w._id, status: 'Done' });
        const inProgress = await Task.countDocuments({ workstreamId: w._id, status: 'In Progress' });
        const todo = await Task.countDocuments({ workstreamId: w._id, status: 'To Do' });
        return {
          workstreamId: w.workstreamId,
          title: w.title,
          status: w.status,
          total,
          done,
          inProgress,
          todo,
          percentage: total === 0 ? 0 : Math.round((done / total) * 100)
        };
      })
    );

    // 7. Upcoming deadlines
    const upcomingDeadlines = await Task.find({
      projectId: targetId,
      status: { $ne: 'Done' },
      dueDate: { $gte: now }
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('assigneeId', 'name');

    // 8. Recent activity
    const recentActivity = await ActivityLog.find({
      $or: [
        { projectId: targetId },
        { projectId: req.params.projectId }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(10);

    return sendSuccess(res, {
      counters: {
        completedLast7Days,
        updatedLast7Days,
        createdLast7Days,
        dueSoonNext7Days
      },
      taskProgress,
      reportedProgress,
      milestoneProgress,
      statusDistribution,
      priorityBreakdown,
      workstreamMetrics,
      upcomingDeadlines,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
};

export const getTeamWorkload = async (req, res, next) => {
  try {
    const rawProject = await resolveProjectId(req.params.projectId);
    if (!rawProject) return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    const project = await Project.findById(rawProject._id).populate('studentIds', 'name email userId student.regNo');
    const targetId = project._id;

    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const totalAssignedTasks = await Task.countDocuments({
      projectId: targetId,
      assigneeId: { $ne: null }
    });

    const membersWorkload = await Promise.all(
      project.studentIds.map(async (student) => {
        const assigned = await Task.countDocuments({ projectId: targetId, assigneeId: student._id });
        const done = await Task.countDocuments({ projectId: targetId, assigneeId: student._id, status: 'Done' });
        const open = assigned - done;
        const awaitingReview = await Task.countDocuments({ projectId: targetId, assigneeId: student._id, status: 'Under Review' });
        const overdue = await Task.countDocuments({
          projectId: targetId,
          assigneeId: student._id,
          status: { $ne: 'Done' },
          dueDate: { $lt: now }
        });
        const upcomingDeadlines = await Task.countDocuments({
          projectId: targetId,
          assigneeId: student._id,
          status: { $ne: 'Done' },
          dueDate: { $gte: now, $lte: next7Days }
        });

        const sharePercentage = totalAssignedTasks === 0 ? 0 : Math.round((assigned / totalAssignedTasks) * 100);

        return {
          student: {
            _id: student._id,
            name: student.name,
            email: student.email,
            userId: student.userId,
            regNo: student.student?.regNo
          },
          assigned,
          open,
          done,
          overdue,
          awaitingReview,
          upcomingDeadlines,
          sharePercentage,
          shareText: `${assigned} of ${totalAssignedTasks} tasks (${sharePercentage}%)`
        };
      })
    );

    return sendSuccess(res, {
      totalAssignedTasks,
      workload: membersWorkload
    });
  } catch (err) {
    next(err);
  }
};

// --- Calendar ---

export const getCalendarEvents = async (req, res, next) => {
  try {
    const { projectId, start, end } = req.query;
    const events = [];

    // 1. Custom CalendarEvents
    const customFilter = { status: 'Scheduled' };
    if (projectId) customFilter.projectId = projectId;
    const customEvents = await CalendarEvent.find(customFilter).populate('organizerId', 'name');

    for (const ce of customEvents) {
      events.push({
        id: ce._id.toString(),
        title: ce.title,
        description: ce.description,
        start: ce.startAt,
        end: ce.endAt,
        eventType: ce.eventType,
        isDerived: false,
        organizer: ce.organizerId?.name || 'Academic Office'
      });
    }

    // 2. Derived Events: Reviews
    const reviewFilter = { status: { $ne: 'Cancelled' } };
    if (projectId) reviewFilter.projectId = projectId;
    const reviews = await Review.find(reviewFilter).populate('projectId', 'title');

    for (const rev of reviews) {
      events.push({
        id: `rev-${rev._id}`,
        title: `${rev.reviewType} - ${rev.projectId?.title || 'Project Review'}`,
        description: `Venue: ${rev.venue}. ${rev.instructions || ''}`,
        start: rev.reviewDate,
        end: new Date(new Date(rev.reviewDate).getTime() + 60 * 60 * 1000), // 1 hour slot
        eventType: 'Presentation',
        isDerived: true,
        sourceType: 'Review',
        sourceId: rev._id.toString()
      });
    }

    // 3. Derived Events: Milestones
    const milestoneFilter = {};
    if (projectId) milestoneFilter.projectId = projectId;
    const milestones = await Milestone.find(milestoneFilter).populate('projectId', 'title');

    for (const ms of milestones) {
      events.push({
        id: `mls-${ms._id}`,
        title: `Milestone: ${ms.title}`,
        description: ms.description,
        start: ms.dueDate,
        end: ms.dueDate,
        allDay: true,
        eventType: 'Deadline',
        isDerived: true,
        sourceType: 'Milestone',
        sourceId: ms._id.toString()
      });
    }

    // 4. Derived Events: Task Deadlines
    const taskFilter = { dueDate: { $ne: null } };
    if (projectId) taskFilter.projectId = projectId;
    const tasks = await Task.find(taskFilter).populate('assigneeId', 'name');

    for (const t of tasks) {
      events.push({
        id: `tsk-${t._id}`,
        title: `Task Due: ${t.title} (${t.taskId})`,
        description: `Assignee: ${t.assigneeId?.name || 'Unassigned'} | Priority: ${t.priority}`,
        start: t.dueDate,
        end: t.dueDate,
        allDay: true,
        eventType: 'Deadline',
        isDerived: true,
        sourceType: 'Task',
        sourceId: t._id.toString()
      });
    }

    return sendSuccess(res, events);
  } catch (err) {
    next(err);
  }
};

export const createCalendarEvent = async (req, res, next) => {
  try {
    const { projectId, title, description, eventType, startAt, endAt, participantIds } = req.body;

    const isGuide = req.user.roles.includes('guide');
    const isHod = req.user.roles.includes('hod');
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only Guide, HOD, or Admin can schedule calendar meetings and presentations');
    }

    const seq = await getNextSequence('calendar-event');
    const eventId = `EVT-${String(seq).padStart(6, '0')}`;

    const event = await CalendarEvent.create({
      eventId,
      projectId: projectId || null,
      departmentId: req.user.departmentId || null,
      title,
      description: description || '',
      eventType,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      organizerId: req.user._id,
      participantIds: participantIds || [],
      status: 'Scheduled'
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'CALENDAR_EVENT_SCHEDULED',
      entity: 'CalendarEvent',
      entityId: event.eventId,
      projectId: event.projectId,
      description: `Scheduled ${event.eventType}: "${event.title}"`
    });

    if (participantIds && participantIds.length > 0) {
      for (const pId of participantIds) {
        await createNotification({
          recipientId: pId,
          category: 'System',
          message: `New calendar event scheduled: "${event.title}" on ${new Date(event.startAt).toLocaleString()}`,
          relatedEntityType: 'Announcement',
          sendEmailNotification: true
        });
      }
    }

    return sendSuccess(res, event, 201);
  } catch (err) {
    next(err);
  }
};

export const getProjectActivity = async (req, res, next) => {
  try {
    const project = await resolveProjectId(req.params.projectId);
    const targetId = project ? project._id : req.params.projectId;

    const activities = await ActivityLog.find({
      $or: [
        { projectId: targetId },
        { projectId: req.params.projectId },
        { entityId: req.params.projectId }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(50);
    return sendSuccess(res, activities);
  } catch (err) {
    next(err);
  }
};
