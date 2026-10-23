import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Project from '../models/Project.js';
import Attendance from '../models/Attendance.js';
import Evaluation from '../models/Evaluation.js';
import Settings, { getSettings } from '../models/Settings.js';
import User from '../models/User.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification, notifyMultipleUsers } from '../services/notificationService.js';
import { logActivity } from '../models/ActivityLog.js';

// Conflict validation helper: checks if guide or any panel member has overlapping review within 1 hour
const checkSchedulingConflicts = async (reviewDate, guideId, panelMemberIds = [], excludeReviewId = null) => {
  const targetTime = new Date(reviewDate).getTime();
  const oneHour = 60 * 60 * 1000;
  const windowStart = new Date(targetTime - oneHour);
  const windowEnd = new Date(targetTime + oneHour);

  const filter = {
    status: { $in: ['Scheduled', 'Rescheduled'] },
    reviewDate: { $gte: windowStart, $lte: windowEnd }
  };

  if (excludeReviewId) {
    filter._id = { $ne: excludeReviewId };
  }

  // Conflict 1: Guide busy
  const guideConflict = await Review.findOne({
    ...filter,
    $or: [{ guideId }, { panelMemberIds: guideId }]
  }).populate('projectId', 'title');

  if (guideConflict) {
    return `Scheduling conflict: Project Guide already has another review scheduled around this time for project "${guideConflict.projectId?.title}".`;
  }

  // Conflict 2: Panel members busy
  if (panelMemberIds && panelMemberIds.length > 0) {
    const panelConflict = await Review.findOne({
      ...filter,
      $or: [
        { guideId: { $in: panelMemberIds } },
        { panelMemberIds: { $in: panelMemberIds } }
      ]
    }).populate('projectId', 'title');

    if (panelConflict) {
      return `Scheduling conflict: One or more assigned panel members are already engaged in a review around this time for project "${panelConflict.projectId?.title}".`;
    }
  }

  return null;
};

// Calculate letter grade based on percentage and settings
const calculateGrade = (percentage, gradeScale) => {
  for (const item of gradeScale) {
    if (percentage >= item.minPercentage && percentage <= item.maxPercentage) {
      return item.grade;
    }
  }
  return percentage < 40 ? 'Fail' : 'C';
};

export const scheduleReview = async (req, res, next) => {
  try {
    const { projectId, reviewType, reviewDate, venue, instructions, panelMemberIds } = req.body;

    let project = null;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      project = await Project.findById(projectId);
    }
    if (!project) {
      project = await Project.findOne({ projectId });
    }
    if (!project) {
      return sendError(res, 404, 'NOT_FOUND', 'Project not found');
    }

    const isGuide = project.guideId.toString() === req.user._id.toString();
    const isHod = req.user.roles.includes('hod') && req.user.departmentId.toString() === project.departmentId.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only the assigned guide, HOD, or admin can schedule reviews');
    }

    // Check conflict
    const conflict = await checkSchedulingConflicts(reviewDate, project.guideId, panelMemberIds);
    if (conflict) {
      return sendError(res, 409, 'SCHEDULING_CONFLICT', conflict);
    }

    const seq = await getNextSequence('review');
    const reviewId = `REV-${String(seq).padStart(4, '0')}`;

    const review = await Review.create({
      reviewId,
      projectId: project._id,
      departmentId: project.departmentId,
      reviewType,
      reviewDate: new Date(reviewDate),
      venue,
      instructions: instructions || '',
      guideId: project.guideId,
      panelMemberIds: panelMemberIds || [],
      status: 'Scheduled'
    });

    // Initialize evaluation with active rubric snapshot
    const settings = await getSettings();
    const evalSeq = await getNextSequence('evaluation');
    const evaluationId = `EVAL-${String(evalSeq).padStart(4, '0')}`;

    const studentEntries = project.studentIds.map((sId) => ({
      studentId: sId,
      panelScores: [],
      marks: 0,
      grade: 'Pending',
      remarks: ''
    }));

    await Evaluation.create({
      evaluationId,
      reviewId: review._id,
      projectId: project._id,
      rubricSnapshot: settings.rubric,
      entries: studentEntries,
      status: 'Draft'
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'REVIEW_SCHEDULED',
      entity: 'Review',
      entityId: review.reviewId,
      projectId: project._id,
      description: `Scheduled ${review.reviewType} on ${new Date(review.reviewDate).toLocaleDateString()} at ${review.venue}`
    });

    // Notify students, guide, and panel members
    const allRecipients = [...project.studentIds, project.guideId, ...(panelMemberIds || [])];
    await notifyMultipleUsers(allRecipients, {
      category: 'Review',
      message: `${review.reviewType} has been scheduled for project "${project.title}" on ${new Date(review.reviewDate).toLocaleString()} at ${review.venue}.`,
      relatedEntityType: 'Review',
      relatedEntityId: review._id.toString(),
      sendEmailNotification: true
    });

    return sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { projectId, panelMemberId, guideId, status, reviewType } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (panelMemberId) filter.panelMemberIds = panelMemberId;
    if (guideId) filter.guideId = guideId;
    if (status) filter.status = status;
    if (reviewType) filter.reviewType = reviewType;

    // Scoping for non-admins
    if (req.user.roles.includes('student')) {
      const studentProjects = await Project.find({ studentIds: req.user._id }).select('_id');
      filter.projectId = { $in: studentProjects.map((p) => p._id) };
    } else if (req.user.roles.includes('panel') && !req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      filter.panelMemberIds = req.user._id;
    } else if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      filter.departmentId = req.user.departmentId;
    }

    const reviews = await Review.find(filter)
      .populate('projectId', 'title projectId studentIds')
      .populate('guideId', 'name email userId guide.facultyId')
      .populate('panelMemberIds', 'name email userId panel.panelId')
      .sort({ reviewDate: 1 });

    return sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    let review = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      review = await Review.findById(req.params.id)
        .populate({
          path: 'projectId',
          populate: { path: 'studentIds', select: 'name email userId student.regNo' }
        })
        .populate('guideId', 'name email userId guide.facultyId')
        .populate('panelMemberIds', 'name email userId panel.panelId panel.designation');
    }
    if (!review) {
      review = await Review.findOne({ reviewId: req.params.id })
        .populate({
          path: 'projectId',
          populate: { path: 'studentIds', select: 'name email userId student.regNo' }
        })
        .populate('guideId', 'name email userId guide.facultyId')
        .populate('panelMemberIds', 'name email userId panel.panelId panel.designation');
    }

    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Review not found');
    }

    const attendance = await Attendance.findOne({ reviewId: review._id })
      .populate('records.studentId', 'name email userId student.regNo')
      .populate('recordedBy', 'name email');

    let evaluation = await Evaluation.findOne({ reviewId: review._id })
      .populate('entries.studentId', 'name email userId student.regNo')
      .populate('entries.panelScores.panelMemberId', 'name email userId');

    // Rule: Students see marks, grade, and comments ONLY when Published (S10)
    if (req.user.roles.includes('student') && evaluation && evaluation.status !== 'Published') {
      evaluation = null; // Hide unpublished draft/submitted marks from students
    }

    const reviewObj = review.toObject ? review.toObject() : review;

    return sendSuccess(res, {
      ...reviewObj,
      review: reviewObj,
      attendance,
      evaluation
    });
  } catch (err) {
    next(err);
  }
};

export const rescheduleReview = async (req, res, next) => {
  try {
    const { reviewDate, venue, reason, panelMemberIds } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Review not found');
    }

    const isGuide = review.guideId.toString() === req.user._id.toString();
    const isHod = req.user.roles.includes('hod') && req.user.departmentId.toString() === review.departmentId.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only Guide, HOD, or Admin can reschedule reviews');
    }

    // Check conflict
    const finalPanel = panelMemberIds || review.panelMemberIds;
    const conflict = await checkSchedulingConflicts(reviewDate, review.guideId, finalPanel, review._id);
    if (conflict) {
      return sendError(res, 409, 'SCHEDULING_CONFLICT', conflict);
    }

    review.rescheduleHistory.push({
      previousDate: review.reviewDate,
      previousVenue: review.venue,
      rescheduledBy: req.user._id,
      reason,
      rescheduledAt: new Date()
    });

    review.reviewDate = new Date(reviewDate);
    review.venue = venue;
    review.status = 'Rescheduled';
    if (panelMemberIds) review.panelMemberIds = panelMemberIds;

    await review.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'REVIEW_RESCHEDULED',
      entity: 'Review',
      entityId: review.reviewId,
      projectId: review.projectId,
      description: `Rescheduled ${review.reviewType} to ${new Date(review.reviewDate).toLocaleDateString()} at ${review.venue}. Reason: ${reason}`
    });

    const project = await Project.findById(review.projectId);
    const allRecipients = [...(project?.studentIds || []), review.guideId, ...review.panelMemberIds];

    await notifyMultipleUsers(allRecipients, {
      category: 'Review',
      message: `${review.reviewType} has been rescheduled to ${new Date(review.reviewDate).toLocaleString()} at ${review.venue}. Reason: ${reason}`,
      relatedEntityType: 'Review',
      relatedEntityId: review._id.toString(),
      sendEmailNotification: true
    });

    return sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
};

export const cancelReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Review not found');
    }

    const isGuide = review.guideId.toString() === req.user._id.toString();
    const isHod = req.user.roles.includes('hod') && req.user.departmentId.toString() === review.departmentId.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only Guide, HOD, or Admin can cancel reviews');
    }

    review.status = 'Cancelled';
    await review.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'REVIEW_CANCELLED',
      entity: 'Review',
      entityId: review.reviewId,
      projectId: review.projectId,
      description: `Cancelled ${review.reviewType}`
    });

    const project = await Project.findById(review.projectId);
    const allRecipients = [...(project?.studentIds || []), review.guideId, ...review.panelMemberIds];

    await notifyMultipleUsers(allRecipients, {
      category: 'Review',
      message: `The ${review.reviewType} scheduled for project "${project?.title}" has been cancelled.`,
      relatedEntityType: 'Review',
      relatedEntityId: review._id.toString()
    });

    return sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
};

// --- Attendance ---

export const recordAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { records, reason } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Review not found');
    }

    const isGuide = review.guideId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isGuide && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only the project guide or admin can mark review attendance');
    }

    let attendance = await Attendance.findOne({ reviewId: review._id });

    if (attendance) {
      // Editing existing attendance: log edit history
      attendance.editHistory.push({
        editedBy: req.user._id,
        editedAt: new Date(),
        reason: reason || 'Attendance updated',
        previousRecords: attendance.records
      });

      attendance.records = records;
      attendance.recordedBy = req.user._id;
      attendance.recordedAt = new Date();
      await attendance.save();
    } else {
      // New attendance
      attendance = await Attendance.create({
        reviewId: review._id,
        projectId: review.projectId,
        records,
        recordedBy: req.user._id,
        recordedAt: new Date()
      });
    }

    // Set review status to Completed
    if (review.status === 'Scheduled' || review.status === 'Rescheduled') {
      review.status = 'Completed';
      await review.save();
    }

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'ATTENDANCE_RECORDED',
      entity: 'Attendance',
      entityId: attendance._id.toString(),
      projectId: review.projectId,
      description: `Marked attendance for ${review.reviewType}`
    });

    return sendSuccess(res, attendance);
  } catch (err) {
    next(err);
  }
};

export const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    let resolvedId = studentId;
    if (studentId === 'me' || studentId === req.user.userId || studentId === req.user._id.toString()) {
      resolvedId = req.user._id.toString();
    }

    // Student can view own attendance (S9), Guide/HOD/Admin can view any student
    const isOwn = req.user._id.toString() === resolvedId || req.user.userId === studentId;
    const isFacultyOrAdmin = req.user.roles.some((r) => ['guide', 'hod', 'admin'].includes(r));

    if (!isOwn && !isFacultyOrAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to view this attendance record');
    }

    const allAttendances = await Attendance.find({
      'records.studentId': { $in: [resolvedId, studentId, req.user.userId, req.user._id] }
    })
      .populate('reviewId', 'reviewType reviewDate venue')
      .populate('projectId', 'title projectId');

    let total = 0;
    let attended = 0;
    const history = [];

    for (const att of allAttendances) {
      const rec = att.records.find((r) => {
        const idStr = r.studentId?.toString();
        return idStr === resolvedId || idStr === studentId || idStr === req.user.userId || idStr === req.user._id.toString();
      });
      if (rec) {
        total++;
        if (rec.status === 'Present') attended++;
        history.push({
          reviewId: att.reviewId?._id,
          reviewType: att.reviewId?.reviewType,
          reviewDate: att.reviewId?.reviewDate,
          venue: att.reviewId?.venue,
          projectTitle: att.projectId?.title,
          status: rec.status,
          note: rec.note
        });
      }
    }

    const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);

    return sendSuccess(res, {
      total,
      attended,
      percentage,
      summaryText: `${attended} of ${total} attended (${percentage}%)`,
      history
    });
  } catch (err) {
    next(err);
  }
};

// --- Evaluation & Marks ---

export const submitPanelScore = async (req, res, next) => {
  try {
    const { id } = req.params; // evaluation id or review id
    let { studentEvaluations, rubric, entries } = req.body;

    let evaluation = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      evaluation = await Evaluation.findById(id);
    }
    if (!evaluation) {
      evaluation = await Evaluation.findOne({ evaluationId: id });
    }
    if (!evaluation) {
      let reviewDoc = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        reviewDoc = await Review.findById(id);
      }
      if (!reviewDoc) {
        reviewDoc = await Review.findOne({ reviewId: id });
      }
      if (reviewDoc) {
        evaluation = await Evaluation.findOne({ reviewId: reviewDoc._id });
      }
    }

    if (!evaluation) {
      return sendError(res, 404, 'NOT_FOUND', 'Evaluation not found');
    }

    const review = await Review.findById(evaluation.reviewId);
    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Linked review not found');
    }

    const isAssignedPanel = review.panelMemberIds.some((p) => p.toString() === req.user._id.toString());
    const isAdmin = req.user.roles.includes('admin');

    if (!isAssignedPanel && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only assigned review panel members can enter and submit marks');
    }

    const settings = await getSettings();

    // Support both studentEvaluations format and entries format (from frontend EvaluationForm)
    if (!studentEvaluations && entries) {
      const activeRubric = rubric || evaluation.rubricSnapshot || settings.rubric;
      studentEvaluations = entries.map((item) => {
        const rubricScores = (item.scores || []).map((sc, idx) => {
          if (typeof sc === 'object' && sc !== null && 'marks' in sc) {
            return sc;
          }
          return {
            criterionIndex: idx,
            criterion: activeRubric[idx]?.criterion || `Criterion ${idx + 1}`,
            marks: Number(sc) || 0
          };
        });
        return {
          studentId: item.studentId,
          scores: rubricScores,
          comments: item.comments || ''
        };
      });
    }

    if (!studentEvaluations || studentEvaluations.length === 0) {
      return sendError(res, 400, 'BAD_REQUEST', 'Student evaluation marks are required');
    }

    // Update each student entry with this panel member's score
    for (const se of studentEvaluations) {
      let entry = evaluation.entries.find((e) => e.studentId.toString() === se.studentId.toString());
      if (!entry) {
        entry = {
          studentId: se.studentId,
          panelScores: [],
          marks: 0,
          grade: 'Pending',
          remarks: ''
        };
        evaluation.entries.push(entry);
      }

      // Calculate total for this panel member
      const totalScore = se.scores.reduce((sum, s) => sum + s.marks, 0);

      // Check if panel member already scored this student
      const existingPanelScoreIndex = entry.panelScores.findIndex(
        (ps) => ps.panelMemberId.toString() === req.user._id.toString()
      );

      const panelScoreObj = {
        panelMemberId: req.user._id,
        scores: se.scores,
        total: totalScore,
        comments: se.comments || '',
        submittedAt: new Date()
      };

      if (existingPanelScoreIndex >= 0) {
        entry.panelScores[existingPanelScoreIndex] = panelScoreObj;
      } else {
        entry.panelScores.push(panelScoreObj);
      }
    }

    // Check if every assigned panel member has submitted scores
    const assignedCount = review.panelMemberIds.length;
    let allPanelMembersSubmitted = assignedCount > 0;

    for (const entry of evaluation.entries) {
      if (entry.panelScores.length < assignedCount) {
        allPanelMembersSubmitted = false;
        break;
      }
    }

    // If all submitted or admin force submit, compute averages and grades
    if (allPanelMembersSubmitted || evaluation.status === 'Submitted') {
      evaluation.status = 'Submitted';

      // Compute total possible marks from rubric snapshot
      const maxRubricMarks = evaluation.rubricSnapshot.reduce((sum, r) => sum + r.maxMarks, 0) || 50;

      for (const entry of evaluation.entries) {
        if (entry.panelScores.length > 0) {
          const sumOfTotals = entry.panelScores.reduce((sum, ps) => sum + ps.total, 0);
          const averageMarks = Number((sumOfTotals / entry.panelScores.length).toFixed(2));
          entry.marks = averageMarks;

          // Percentage against rubric maximum
          const percentage = (averageMarks / maxRubricMarks) * 100;
          entry.grade = calculateGrade(percentage, settings.gradeScale);
        }
      }
    }

    await evaluation.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PANEL_EVALUATION_SUBMITTED',
      entity: 'Evaluation',
      entityId: evaluation.evaluationId,
      projectId: evaluation.projectId,
      description: `Panel score submitted for ${review.reviewType} (Status: ${evaluation.status})`
    });

    return sendSuccess(res, evaluation);
  } catch (err) {
    next(err);
  }
};

export const publishEvaluation = async (req, res, next) => {
  try {
    let evaluation = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      evaluation = await Evaluation.findById(req.params.id);
    }
    if (!evaluation) {
      evaluation = await Evaluation.findOne({ evaluationId: req.params.id });
    }

    if (!evaluation) {
      return sendError(res, 404, 'NOT_FOUND', 'Evaluation not found');
    }

    const project = await Project.findById(evaluation.projectId);
    const isHod = req.user.roles.includes('hod') && req.user.departmentId && project.departmentId && req.user.departmentId.toString() === project.departmentId.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only HOD or Admin can publish evaluation results');
    }

    evaluation.status = 'Published';
    evaluation.publishedBy = req.user._id;
    evaluation.publishedAt = new Date();
    await evaluation.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'EVALUATION_PUBLISHED',
      entity: 'Evaluation',
      entityId: evaluation.evaluationId,
      projectId: project ? project._id : null,
      description: `Published official evaluation marks for ${project ? project.title : evaluation.evaluationId}`
    });

    // Notify students
    const studentIds = project?.studentIds || [];
    if (studentIds.length > 0) {
      await notifyMultipleUsers(studentIds, {
        category: 'Evaluation',
        message: `Evaluation results have been officially published for your project "${project.title}". You can now view your rubric marks and grade.`,
        relatedEntityType: 'Evaluation',
        relatedEntityId: evaluation._id.toString(),
        sendEmailNotification: true
      });
    }

    return sendSuccess(res, evaluation);
  } catch (err) {
    next(err);
  }
};

export const unlockEvaluation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    let evaluation = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      evaluation = await Evaluation.findById(req.params.id);
    }
    if (!evaluation) {
      evaluation = await Evaluation.findOne({ evaluationId: req.params.id });
    }

    if (!evaluation) {
      return sendError(res, 404, 'NOT_FOUND', 'Evaluation not found');
    }

    if (!req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only administrators can unlock published evaluation records');
    }

    evaluation.unlockHistory.push({
      unlockedBy: req.user._id,
      unlockedAt: new Date(),
      reason
    });

    evaluation.status = 'Submitted';
    await evaluation.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'EVALUATION_UNLOCKED',
      entity: 'Evaluation',
      entityId: evaluation.evaluationId,
      projectId: evaluation.projectId,
      description: `Admin unlocked published evaluation. Reason: ${reason}`
    });

    return sendSuccess(res, evaluation);
  } catch (err) {
    next(err);
  }
};

export const assignPanel = async (req, res, next) => {
  try {
    const { panelMemberIds } = req.body;
    let review = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      review = await Review.findById(req.params.id);
    }
    if (!review) {
      review = await Review.findOne({ reviewId: req.params.id });
    }

    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Review not found');
    }

    review.panelMemberIds = panelMemberIds || [];
    await review.save();

    // Ensure Evaluation document exists for this review
    let evaluation = await Evaluation.findOne({ reviewId: review._id });
    if (!evaluation) {
      const project = await Project.findById(review.projectId);
      if (project) {
        const settings = await getSettings();
        const evalSeq = await getNextSequence('evaluation');
        const evaluationId = `EVAL-${String(evalSeq).padStart(4, '0')}`;
        const studentEntries = (project.studentIds || []).map((sId) => ({
          studentId: sId,
          panelScores: [],
          marks: 0,
          grade: 'Pending',
          remarks: ''
        }));
        evaluation = await Evaluation.create({
          evaluationId,
          reviewId: review._id,
          projectId: project._id,
          rubricSnapshot: settings.rubric,
          entries: studentEntries,
          status: 'Draft'
        });
      }
    }

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PANEL_ASSIGNED',
      entity: 'Review',
      entityId: review.reviewId,
      projectId: review.projectId,
      description: `Assigned ${(panelMemberIds || []).length} panel members to ${review.reviewType}`
    });

    if (panelMemberIds && panelMemberIds.length > 0) {
      await notifyMultipleUsers(panelMemberIds, {
        category: 'Review',
        message: `You have been assigned to evaluate review session ${review.reviewType} (ID: ${review.reviewId}).`,
        relatedEntityType: 'Review',
        relatedEntityId: review._id.toString(),
        sendEmailNotification: true
      });
    }

    return sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
};

export const getEvaluations = async (req, res, next) => {
  try {
    const { projectId, reviewId, status } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (reviewId) filter.reviewId = reviewId;
    if (status) filter.status = status;

    if (req.user.roles.includes('student')) {
      const studentProjects = await Project.find({ studentIds: req.user._id }).select('_id');
      filter.projectId = { $in: studentProjects.map((p) => p._id) };
      filter.status = 'Published';
    } else if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      const deptProjects = await Project.find({ departmentId: req.user.departmentId }).select('_id');
      filter.projectId = { $in: deptProjects.map((p) => p._id) };
    }

    const evaluations = await Evaluation.find(filter)
      .populate('reviewId', 'reviewId reviewType reviewDate status venue')
      .populate('projectId', 'projectId title departmentId studentIds guideId')
      .populate('entries.studentId', 'name email userId student.regNo')
      .sort({ createdAt: -1 });

    const formatted = evaluations.map((ev) => {
      const obj = ev.toObject ? ev.toObject() : ev;
      return {
        ...obj,
        review: obj.reviewId // for frontend compatibility (ev.review?.reviewType)
      };
    });

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
};

export const getReviewEvaluation = async (req, res, next) => {
  try {
    let review = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      review = await Review.findById(req.params.id);
    }
    if (!review) {
      review = await Review.findOne({ reviewId: req.params.id });
    }

    if (!review) {
      return sendError(res, 404, 'NOT_FOUND', 'Review not found');
    }

    let evaluation = await Evaluation.findOne({ reviewId: review._id })
      .populate('entries.studentId', 'name email userId student.regNo')
      .populate('entries.panelScores.panelMemberId', 'name email userId');

    if (!evaluation) {
      const project = await Project.findById(review.projectId);
      if (project) {
        const settings = await getSettings();
        const evalSeq = await getNextSequence('evaluation');
        const evaluationId = `EVAL-${String(evalSeq).padStart(4, '0')}`;
        const studentEntries = (project.studentIds || []).map((sId) => ({
          studentId: sId,
          panelScores: [],
          marks: 0,
          grade: 'Pending',
          remarks: ''
        }));
        evaluation = await Evaluation.create({
          evaluationId,
          reviewId: review._id,
          projectId: project._id,
          rubricSnapshot: settings.rubric,
          entries: studentEntries,
          status: 'Draft'
        });
      }
    }

    if (!evaluation) {
      return sendError(res, 404, 'NOT_FOUND', 'Evaluation record could not be found or initialized');
    }

    const evalObj = evaluation.toObject ? evaluation.toObject() : evaluation;
    evalObj.entries = (evalObj.entries || []).map((entry) => {
      const myScoreObj = (entry.panelScores || []).find(
        (ps) => ps.panelMemberId?._id?.toString() === req.user._id.toString() ||
                ps.panelMemberId?.toString() === req.user._id.toString()
      );
      return {
        ...entry,
        myScores: myScoreObj ? {
          scores: (myScoreObj.scores || []).map((s) => s.marks),
          comments: myScoreObj.comments || ''
        } : null
      };
    });

    evalObj.rubric = evalObj.rubricSnapshot || [];

    return sendSuccess(res, evalObj);
  } catch (err) {
    next(err);
  }
};
