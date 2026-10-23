import ProgressReport from '../models/ProgressReport.js';
import Feedback from '../models/Feedback.js';
import Project from '../models/Project.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Settings, { getSettings } from '../models/Settings.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification, notifyMultipleUsers } from '../services/notificationService.js';
import { logActivity } from '../models/ActivityLog.js';

// Calculate Monday of the given week
const getMondayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const submitProgressReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { weekNo, workDone, plannedNext, blockers, progress, remarks, attachmentDocumentIds } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    }

    const isMember = project.studentIds.some((s) => s.toString() === req.user._id.toString());
    if (!isMember && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only team members can submit weekly progress reports');
    }

    if (project.status !== 'Active') {
      return sendError(res, 409, 'INVALID_PROJECT_STATUS', `Progress reports can only be submitted for 'Active' projects`);
    }

    // Check duplicate for this week
    const existing = await ProgressReport.findOne({ projectId, weekNo });
    if (existing) {
      return sendError(res, 409, 'DUPLICATE_REPORT', `A weekly progress report for Week ${weekNo} has already been submitted`);
    }

    const now = new Date();
    const weekStartDate = getMondayOfWeek(now);

    // Compute late flag based on Sunday 23:59 IST deadline of this week
    const deadline = new Date(weekStartDate);
    deadline.setDate(deadline.getDate() + 6);
    deadline.setHours(23, 59, 59, 999);
    const isLate = now > deadline;

    const seq = await getNextSequence('progress-report');
    const reportId = `REP-${String(seq).padStart(6, '0')}`;

    const report = await ProgressReport.create({
      reportId,
      projectId: project._id,
      weekNo,
      weekStartDate,
      workDone,
      plannedNext,
      blockers: blockers || '',
      progress,
      remarks: remarks || '',
      attachments: attachmentDocumentIds || [],
      status: 'Submitted',
      late: isLate,
      submittedBy: req.user._id
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PROGRESS_REPORT_SUBMITTED',
      entity: 'ProgressReport',
      entityId: report.reportId,
      projectId: project._id,
      description: `Week ${weekNo} progress report submitted (${progress}% progress, Late: ${isLate ? 'Yes' : 'No'})`
    });

    // Notify Guide
    await createNotification({
      recipientId: project.guideId,
      category: 'Progress',
      message: `Team for "${project.title}" submitted Week ${weekNo} progress report. Reported progress: ${progress}%.`,
      relatedEntityType: 'ProgressReport',
      relatedEntityId: report._id.toString()
    });

    return sendSuccess(res, report, 201);
  } catch (err) {
    next(err);
  }
};

export const getProjectProgressReports = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const reports = await ProgressReport.find({ projectId })
      .populate('submittedBy', 'name email userId')
      .populate('attachments', 'fileName storedFilename fileType size')
      .sort({ weekNo: 1 });

    return sendSuccess(res, reports);
  } catch (err) {
    next(err);
  }
};

export const updateProgressReport = async (req, res, next) => {
  try {
    const report = await ProgressReport.findById(req.params.id);
    if (!report) {
      return sendError(res, 404, 'NOT_FOUND', 'Progress report not found');
    }

    const project = await Project.findById(report.projectId);
    const isMember = project && project.studentIds.some((s) => s.toString() === req.user._id.toString());

    if (!isMember && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only team members can edit this progress report');
    }

    // Editable until guide gives feedback (status !== 'Submitted' means guide evaluated/commented)
    if (report.status !== 'Submitted') {
      return sendError(res, 409, 'CANNOT_EDIT', `Report cannot be edited after guide review (Current status: ${report.status})`);
    }

    const { workDone, plannedNext, blockers, progress, remarks, attachmentDocumentIds } = req.body;

    if (workDone) report.workDone = workDone;
    if (plannedNext) report.plannedNext = plannedNext;
    if (blockers !== undefined) report.blockers = blockers;
    if (progress !== undefined) report.progress = progress;
    if (remarks !== undefined) report.remarks = remarks;
    if (attachmentDocumentIds) report.attachments = attachmentDocumentIds;

    await report.save();

    return sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
};

export const createFeedback = async (req, res, next) => {
  try {
    const { projectId, proposalId, targetType, targetId, comments, reportStatus } = req.body;

    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
    }

    const isGuide = project && project.guideId.toString() === req.user._id.toString();
    const isHod = req.user.roles.includes('hod');
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only the assigned guide, HOD, or admin can provide official feedback');
    }

    const seq = await getNextSequence('feedback');
    const feedbackId = `FBK-${String(seq).padStart(6, '0')}`;

    const recipients = project ? project.studentIds : [];

    const feedback = await Feedback.create({
      feedbackId,
      projectId: projectId || null,
      proposalId: proposalId || null,
      targetType,
      targetId,
      authorId: req.user._id,
      recipientIds: recipients,
      comments,
      date: new Date()
    });

    // If target is ProgressReport, guide can update report status
    if (targetType === 'ProgressReport' && reportStatus) {
      const report = await ProgressReport.findById(targetId);
      if (report) {
        report.status = reportStatus;
        await report.save();
      }
    }

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'FEEDBACK_ADDED',
      entity: 'Feedback',
      entityId: feedback.feedbackId,
      projectId: projectId || null,
      description: `Added feedback on ${targetType} (Status: ${reportStatus || 'Commented'})`
    });

    if (recipients.length > 0) {
      await notifyMultipleUsers(recipients, {
        category: 'Feedback',
        message: `New feedback received on ${targetType}: "${comments.slice(0, 60)}..."`,
        relatedEntityType: targetType,
        relatedEntityId: targetId
      });
    }

    return sendSuccess(res, feedback, 201);
  } catch (err) {
    next(err);
  }
};

export const getFeedbackForTarget = async (req, res, next) => {
  try {
    const { targetType, targetId, projectId } = req.query;
    const filter = {};

    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (projectId) filter.projectId = projectId;

    const feedbackList = await Feedback.find(filter)
      .populate('authorId', 'name email userId roles')
      .sort({ date: 1 });

    return sendSuccess(res, feedbackList);
  } catch (err) {
    next(err);
  }
};

export const editFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return sendError(res, 404, 'NOT_FOUND', 'Feedback record not found');
    }

    const isAuthor = feedback.authorId.toString() === req.user._id.toString();
    if (!isAuthor && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only the feedback author or admin can edit this feedback');
    }

    const { comments } = req.body;
    feedback.editHistory.push({
      previousComments: feedback.comments,
      editedAt: new Date()
    });

    feedback.comments = comments;
    await feedback.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'FEEDBACK_EDITED',
      entity: 'Feedback',
      entityId: feedback.feedbackId,
      projectId: feedback.projectId,
      description: `Updated feedback comments (Revision history preserved)`
    });

    return sendSuccess(res, feedback);
  } catch (err) {
    next(err);
  }
};

export const submitFinalProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { finalTitle, finalAbstract, technologiesUsed, repositoryUrl } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    }

    const isMember = project.studentIds.some((s) => s.toString() === req.user._id.toString());
    if (!isMember && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only project team members can submit the final project');
    }

    if (project.status !== 'Active') {
      return sendError(res, 409, 'INVALID_STATUS', `Cannot submit final project when project status is '${project.status}'`);
    }

    // Must have uploaded at least one final report document
    const finalReportDoc = await Document.findOne({
      projectId: project._id,
      category: 'Report',
      isDeleted: false
    });

    if (!finalReportDoc) {
      return sendError(
        res,
        400,
        'MISSING_FINAL_REPORT',
        'Final submission requires at least one uploaded document under the "Report" category'
      );
    }

    project.status = 'Final Submitted';
    project.finalDetails = {
      finalTitle,
      finalAbstract,
      technologiesUsed,
      repositoryUrl,
      submittedAt: new Date()
    };

    await project.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'FINAL_PROJECT_SUBMITTED',
      entity: 'Project',
      entityId: project.projectId,
      projectId: project._id,
      description: `Team submitted final project details and documentation`
    });

    // Notify Guide
    await createNotification({
      recipientId: project.guideId,
      category: 'Project',
      message: `Team for project "${project.title}" has submitted their Final Project! Status is now 'Final Submitted'.`,
      relatedEntityType: 'Project',
      relatedEntityId: project._id.toString(),
      sendEmailNotification: true
    });

    return sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
};
