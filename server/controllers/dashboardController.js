import Project from '../models/Project.js';
import ProjectProposal from '../models/ProjectProposal.js';
import Task from '../models/Task.js';
import Review from '../models/Review.js';
import Evaluation from '../models/Evaluation.js';
import ProgressReport from '../models/ProgressReport.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import ActivityLog from '../models/ActivityLog.js';
import Settings from '../models/Settings.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // 1. Proposals
    const proposals = await ProjectProposal.find({ studentIds: studentId })
      .populate('assignedGuideId', 'name email userId')
      .sort({ createdAt: -1 });

    // 2. Active / assigned projects
    const projects = await Project.find({ studentIds: studentId })
      .populate('guideId', 'name email userId phone guide.facultyId')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    const activeProject = projects[0] || null;

    let computedMetrics = null;
    let nextReview = null;
    let missingWeeklyReport = false;

    if (activeProject) {
      const totalTasks = await Task.countDocuments({ projectId: activeProject._id });
      const doneTasks = await Task.countDocuments({ projectId: activeProject._id, status: 'Done' });
      const taskProgress = totalTasks === 0 ? 'No tasks yet' : `${Math.round((doneTasks / totalTasks) * 100)}%`;

      const latestReport = await ProgressReport.findOne({ projectId: activeProject._id }).sort({ weekNo: -1 });
      const reportedProgress = latestReport ? `${latestReport.progress}%` : '0%';

      computedMetrics = {
        totalTasks,
        doneTasks,
        taskProgress,
        reportedProgress
      };

      // Next upcoming review
      nextReview = await Review.findOne({
        projectId: activeProject._id,
        status: { $in: ['Scheduled', 'Rescheduled'] },
        reviewDate: { $gte: new Date() }
      }).sort({ reviewDate: 1 });

      // Check if current week's report is missing
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const thisWeekReport = await ProgressReport.findOne({
        projectId: activeProject._id,
        weekStartDate: { $gte: monday }
      });
      missingWeeklyReport = !thisWeekReport;
    }

    // 3. Open tasks & upcoming deadlines for this student
    const openTasks = await Task.find({
      assigneeId: studentId,
      status: { $in: ['To Do', 'In Progress', 'Under Review', 'Blocked'] }
    }).sort({ dueDate: 1 }).limit(10);

    // 4. Recent feedback
    const recentFeedback = await Feedback.find({
      recipientIds: studentId
    }).populate('authorId', 'name email').sort({ date: -1 }).limit(5);

    // 5. Unread notifications count
    const unreadNotificationsCount = await Notification.countDocuments({
      recipientId: studentId,
      status: 'Unread'
    });

    return sendSuccess(res, {
      proposals,
      activeProject,
      computedMetrics,
      openTasks,
      nextReview,
      missingWeeklyReport,
      recentFeedback,
      unreadNotificationsCount
    });
  } catch (err) {
    next(err);
  }
};

export const getGuideDashboard = async (req, res, next) => {
  try {
    const guideId = req.user._id;

    // 1. Assigned teams
    const assignedProjects = await Project.find({ guideId })
      .populate('studentIds', 'name email userId student.regNo')
      .populate('departmentId', 'name code');

    // 2. Pending proposals needing review
    const pendingProposals = await ProjectProposal.find({
      assignedGuideId: guideId,
      approvalStatus: 'With Guide'
    }).populate('studentIds', 'name email userId student.regNo');

    // 3. Weekly reports awaiting feedback (status === 'Submitted')
    const projectIds = assignedProjects.map((p) => p._id);
    const reportsAwaitingFeedback = await ProgressReport.find({
      projectId: { $in: projectIds },
      status: 'Submitted'
    }).populate('projectId', 'title projectId').sort({ createdAt: -1 });

    // 4. Tasks awaiting review
    const tasksAwaitingReview = await Task.find({
      projectId: { $in: projectIds },
      status: 'Under Review'
    }).populate('projectId', 'title').populate('assigneeId', 'name');

    // 5. Overdue tasks
    const now = new Date();
    const overdueTasks = await Task.find({
      projectId: { $in: projectIds },
      status: { $ne: 'Done' },
      dueDate: { $lt: now }
    }).populate('projectId', 'title').populate('assigneeId', 'name');

    // 6. Upcoming reviews
    const upcomingReviews = await Review.find({
      $or: [{ guideId }, { panelMemberIds: guideId }],
      status: { $in: ['Scheduled', 'Rescheduled'] },
      reviewDate: { $gte: now }
    }).populate('projectId', 'title').sort({ reviewDate: 1 });

    // 7. Workload summary
    const openTasksCount = await Task.countDocuments({
      projectId: { $in: projectIds },
      status: { $ne: 'Done' }
    });

    return sendSuccess(res, {
      assignedProjectsCount: assignedProjects.length,
      assignedProjects,
      pendingProposalsCount: pendingProposals.length,
      pendingProposals,
      reportsAwaitingFeedbackCount: reportsAwaitingFeedback.length,
      reportsAwaitingFeedback,
      tasksAwaitingReviewCount: tasksAwaitingReview.length,
      tasksAwaitingReview,
      overdueTasksCount: overdueTasks.length,
      overdueTasks,
      upcomingReviews,
      workload: {
        activeProjects: assignedProjects.length,
        pendingReports: reportsAwaitingFeedback.length,
        openTasks: openTasksCount
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getHodDashboard = async (req, res, next) => {
  try {
    const departmentId = req.user.departmentId;
    if (!departmentId) {
      return sendError(res, 400, 'NO_DEPARTMENT', 'HOD account is not linked to any department');
    }

    // 1. Total projects & Projects by status
    const totalProjectsCount = await Project.countDocuments({ departmentId });
    const statusAgg = await Project.aggregate([
      { $match: { departmentId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const projectsByStatus = {};
    statusAgg.forEach((s) => {
      projectsByStatus[s._id] = s.count;
    });

    // 2. Pending guide allocations
    const pendingAllocations = await ProjectProposal.find({
      departmentId,
      approvalStatus: 'Submitted'
    }).populate('studentIds', 'name email userId').populate('mentorChoices', 'name email userId');

    // 3. Pending topic approvals
    const pendingTopicApprovals = await ProjectProposal.find({
      departmentId,
      approvalStatus: 'Guide Approved'
    }).populate('studentIds', 'name email userId').populate('assignedGuideId', 'name email userId');

    // 4. Guide workload
    const guides = await User.find({ departmentId, roles: 'guide', accountStatus: 'Active' });
    const guideWorkloads = await Promise.all(
      guides.map(async (g) => {
        const activeCount = await Project.countDocuments({
          guideId: g._id,
          status: { $in: ['Active', 'On Hold', 'Final Submitted', 'Under Evaluation'] }
        });
        const limit = g.guide?.maxStudents || 8;
        return {
          _id: g._id,
          guideId: g.userId || g._id,
          name: g.name,
          email: g.email,
          facultyId: g.guide?.facultyId || 'FACULTY',
          activeProjects: activeCount,
          activeProjectsCount: activeCount,
          capacityLimit: limit
        };
      })
    );

    // 5. Weekly report compliance
    const activeProjects = await Project.find({
      departmentId,
      status: { $in: ['Active', 'Final Submitted', 'Under Evaluation'] }
    });
    let submittedReportsCount = 0;
    for (const proj of activeProjects) {
      const rep = await ProgressReport.findOne({ projectId: proj._id });
      if (rep) submittedReportsCount++;
    }
    const weeklyReportComplianceRate = activeProjects.length === 0 ? 100 : Math.round((submittedReportsCount / activeProjects.length) * 100);

    // 6. Upcoming reviews in department
    const upcomingReviews = await Review.find({
      departmentId,
      status: { $in: ['Scheduled', 'Rescheduled'] }
    }).populate('projectId', 'title projectId').sort({ reviewDate: 1 });

    const formattedPendingApprovals = pendingTopicApprovals.map((p) => {
      const pObj = p.toObject();
      return {
        ...pObj,
        assignedGuide: p.assignedGuideId
      };
    });

    return sendSuccess(res, {
      totalProjectsCount,
      projectsByStatus,
      pendingAllocationsCount: pendingAllocations.length,
      pendingAllocations,
      pendingTopicApprovalsCount: pendingTopicApprovals.length,
      pendingTopicApprovals,
      pendingApprovals: formattedPendingApprovals,
      weeklyReportComplianceRate,
      reportCompliance: {
        activeProjectsCount: activeProjects.length,
        submittedThisWeek: submittedReportsCount,
        percentage: weeklyReportComplianceRate
      },
      upcomingReviewsCount: upcomingReviews.length,
      upcomingReviews,
      guideWorkloads
    });
  } catch (err) {
    next(err);
  }
};

export const getPanelDashboard = async (req, res, next) => {
  try {
    const panelId = req.user._id;

    // 1. Assigned reviews
    const assignedReviews = await Review.find({
      panelMemberIds: panelId,
      status: { $ne: 'Cancelled' }
    })
      .populate('projectId', 'title projectId studentIds domain')
      .populate('guideId', 'name email')
      .sort({ reviewDate: 1 });

    // 2. Evaluations pending submission from this panel member
    const reviewIds = assignedReviews.map((r) => r._id);
    const evaluations = await Evaluation.find({
      reviewId: { $in: reviewIds }
    }).populate('reviewId');

    const pendingEvaluations = [];

    for (const ev of evaluations) {
      // Check if this panel member has submitted scores for every student entry
      let memberHasSubmittedAll = true;
      for (const entry of ev.entries) {
        const hasMemberScore = entry.panelScores.some(
          (ps) => ps.panelMemberId.toString() === panelId.toString()
        );
        if (!hasMemberScore) {
          memberHasSubmittedAll = false;
          break;
        }
      }

      if (!memberHasSubmittedAll && ev.status !== 'Published') {
        pendingEvaluations.push(ev);
      }
    }

    return sendSuccess(res, {
      assignedReviewsCount: assignedReviews.length,
      assignedReviews,
      pendingEvaluationsCount: pendingEvaluations.length,
      pendingEvaluations
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    // 1. Users by role & department
    const totalUsersCount = await User.countDocuments();
    const pendingRegistrations = await User.find({ accountStatus: 'Pending Approval' }).limit(10);
    const pendingRegistrationsCount = await User.countDocuments({ accountStatus: 'Pending Approval' });

    const roleAgg = await User.aggregate([
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } }
    ]);
    const usersByRole = {};
    roleAgg.forEach((r) => {
      usersByRole[r._id] = r.count;
    });

    const departmentsCount = await Department.countDocuments();
    const usersByDepartment = await User.aggregate([
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { departmentName: '$dept.name', count: 1 } }
    ]);

    // 2. Projects by department & status
    const totalProjectsCount = await Project.countDocuments();
    const statusAgg = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const projectsByStatus = {};
    statusAgg.forEach((s) => {
      projectsByStatus[s._id] = s.count;
    });

    // 3. Proposals count
    const proposalsCount = await ProjectProposal.countDocuments();

    // 4. Recent activity
    const recentActivity = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    return sendSuccess(res, {
      totalUsersCount,
      usersCount: totalUsersCount,
      pendingRegistrationsCount,
      pendingRegistrations,
      usersByRole,
      usersByDepartment,
      departmentsCount,
      totalProjectsCount,
      projectsCount: totalProjectsCount,
      projectsByStatus,
      proposalsCount,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
};
