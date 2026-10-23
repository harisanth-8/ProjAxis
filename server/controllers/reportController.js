import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ProjectProposal from '../models/ProjectProposal.js';
import Review from '../models/Review.js';
import Attendance from '../models/Attendance.js';
import Evaluation from '../models/Evaluation.js';
import ProgressReport from '../models/ProgressReport.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// Helper to convert array of objects to CSV string
const convertToCSV = (data, fields) => {
  if (!data || !data.length) return '';
  const header = fields.map((f) => `"${f.label || f.key}"`).join(',');
  const rows = data.map((item) =>
    fields.map((f) => {
      let val = item[f.key];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...rows].join('\r\n');
};

const sendReportResponse = (res, data, fields, reportName, format) => {
  if (format === 'csv') {
    const csv = convertToCSV(data, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportName}-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  }
  return sendSuccess(res, { reportName, fields, data });
};

export const getProjectStatusReport = async (req, res, next) => {
  try {
    const { departmentId, status, format } = req.query;
    const filter = {};

    if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      filter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .populate('departmentId', 'name code')
      .populate('guideId', 'name email guide.facultyId')
      .populate('studentIds', 'name student.regNo')
      .sort({ createdAt: -1 });

    const reportData = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const doneTasks = await Task.countDocuments({ projectId: p._id, status: 'Done' });
        const taskProgress = totalTasks === 0 ? 'No tasks' : `${Math.round((doneTasks / totalTasks) * 100)}%`;

        return {
          projectId: p.projectId,
          title: p.title,
          domain: p.domain,
          department: p.departmentId?.name || '',
          guide: p.guideId?.name || 'Unassigned',
          guideName: p.guideId?.name || 'Unassigned',
          teamMembers: p.studentIds.map((s) => `${s.name} (${s.student?.regNo || ''})`).join('; '),
          teamSize: p.studentIds.length,
          status: p.status,
          taskProgress,
          academicYear: p.academicYear
        };
      })
    );

    const fields = [
      { key: 'projectId', label: 'Project ID' },
      { key: 'title', label: 'Title' },
      { key: 'domain', label: 'Domain' },
      { key: 'department', label: 'Department' },
      { key: 'guideName', label: 'Guide' },
      { key: 'teamSize', label: 'Team Size' },
      { key: 'status', label: 'Status' },
      { key: 'taskProgress', label: 'Task Progress' },
      { key: 'academicYear', label: 'Academic Year' }
    ];

    return sendReportResponse(res, reportData, fields, 'Project-Status-Report', format);
  } catch (err) {
    next(err);
  }
};

export const getTaskCompletionReport = async (req, res, next) => {
  try {
    const { departmentId, format } = req.query;
    const projectFilter = {};

    if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      projectFilter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      projectFilter.departmentId = departmentId;
    }

    const projects = await Project.find(projectFilter).select('_id projectId title');
    const now = new Date();

    const reportData = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const doneTasks = await Task.countDocuments({ projectId: p._id, status: 'Done' });
        const overdueTasks = await Task.countDocuments({
          projectId: p._id,
          status: { $ne: 'Done' },
          dueDate: { $lt: now }
        });
        const completionRate = totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}%` : '0%';

        return {
          projectId: p.projectId,
          title: p.title,
          totalTasks,
          doneTasks,
          overdueTasks,
          completionRate
        };
      })
    );

    const fields = [
      { key: 'projectId', label: 'Project ID' },
      { key: 'title', label: 'Project Title' },
      { key: 'totalTasks', label: 'Total Tasks' },
      { key: 'doneTasks', label: 'Done' },
      { key: 'overdueTasks', label: 'Overdue' },
      { key: 'completionRate', label: 'Completion Rate' }
    ];

    return sendReportResponse(res, reportData, fields, 'Task-Completion-Report', format);
  } catch (err) {
    next(err);
  }
};

export const getGuideWorkloadReport = async (req, res, next) => {
  try {
    const { departmentId, format } = req.query;
    const filter = { roles: 'guide', accountStatus: 'Active' };

    if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      filter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    const guides = await User.find(filter).populate('departmentId', 'name code');

    const reportData = await Promise.all(
      guides.map(async (g) => {
        const activeProjects = await Project.countDocuments({
          guideId: g._id,
          status: { $in: ['Active', 'On Hold', 'Final Submitted', 'Under Evaluation'] }
        });
        const completedProjects = await Project.countDocuments({
          guideId: g._id,
          status: 'Completed'
        });
        const pendingProposals = await ProjectProposal.countDocuments({
          assignedGuideId: g._id,
          approvalStatus: 'With Guide'
        });
        const capacityLimit = g.guide?.maxStudents || 8;

        return {
          facultyId: g.guide?.facultyId || '',
          name: g.name,
          email: g.email,
          department: g.departmentId?.name || '',
          activeProjectsCount: activeProjects,
          activeProjects,
          completedProjects,
          pendingProposals,
          capacityLimit,
          totalProjects: activeProjects + completedProjects
        };
      })
    );

    const fields = [
      { key: 'facultyId', label: 'Faculty ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'activeProjectsCount', label: 'Active Projects' },
      { key: 'capacityLimit', label: 'Capacity Cap' },
      { key: 'completedProjects', label: 'Completed' },
      { key: 'pendingProposals', label: 'Pending Proposals' }
    ];

    return sendReportResponse(res, reportData, fields, 'Guide-Workload-Report', format);
  } catch (err) {
    next(err);
  }
};

export const getProposalPipelineReport = async (req, res, next) => {
  try {
    const { departmentId, format } = req.query;
    const filter = {};

    if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      filter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    const proposals = await ProjectProposal.find(filter)
      .populate('departmentId', 'name code')
      .populate('assignedGuideId', 'name')
      .sort({ createdAt: -1 });

    const reportData = proposals.map((prop) => ({
      proposalId: prop.proposalId,
      title: prop.title,
      department: prop.departmentId?.name || '',
      assignedGuideName: prop.assignedGuideId?.name || 'Unassigned',
      submissionDate: prop.createdAt,
      approvalStatus: prop.approvalStatus,
      academicYear: prop.academicYear
    }));

    const fields = [
      { key: 'proposalId', label: 'Proposal ID' },
      { key: 'title', label: 'Title' },
      { key: 'department', label: 'Department' },
      { key: 'assignedGuideName', label: 'Assigned Guide' },
      { key: 'submissionDate', label: 'Submission Date' },
      { key: 'approvalStatus', label: 'Approval Status' },
      { key: 'academicYear', label: 'Academic Year' }
    ];

    return sendReportResponse(res, reportData, fields, 'Proposal-Pipeline-Report', format);
  } catch (err) {
    next(err);
  }
};

export const getWeeklyComplianceReport = async (req, res, next) => {
  try {
    const { departmentId, format } = req.query;
    const filter = { status: { $in: ['Active', 'On Hold', 'Final Submitted', 'Under Evaluation'] } };

    if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      filter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    const projects = await Project.find(filter)
      .populate('guideId', 'name')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });

    const reportData = await Promise.all(
      projects.map(async (p) => {
        const reports = await ProgressReport.find({ projectId: p._id }).sort({ weekNo: -1, weekNumber: -1 });
        const submittedReportsCount = reports.length;
        const latestWeekNo = reports[0]?.weekNo ?? reports[0]?.weekNumber ?? null;
        const isCompliant = submittedReportsCount >= 1;

        return {
          projectId: p.projectId,
          title: p.title,
          department: p.departmentId?.name || '',
          guideName: p.guideId?.name || 'Unassigned',
          submittedReportsCount,
          latestWeekNo: latestWeekNo ? latestWeekNo : '-',
          isCompliant,
          compliance: isCompliant ? 'Compliant' : 'Missing Reports'
        };
      })
    );

    const fields = [
      { key: 'projectId', label: 'Project ID' },
      { key: 'title', label: 'Project Title' },
      { key: 'department', label: 'Department' },
      { key: 'guideName', label: 'Guide' },
      { key: 'submittedReportsCount', label: 'Reports Submitted' },
      { key: 'latestWeekNo', label: 'Latest Week' },
      { key: 'compliance', label: 'Compliance Status' }
    ];

    return sendReportResponse(res, reportData, fields, 'Weekly-Compliance-Report', format);
  } catch (err) {
    next(err);
  }
};

export const getMarksSheetReport = async (req, res, next) => {
  try {
    const { departmentId, reviewType, format } = req.query;
    const projectFilter = {};

    if (req.user.roles.includes('hod') && !req.user.roles.includes('admin')) {
      projectFilter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      projectFilter.departmentId = departmentId;
    }

    const projects = await Project.find(projectFilter).select('_id');
    const projectIds = projects.map((p) => p._id);

    const reviewFilter = { projectId: { $in: projectIds } };
    if (reviewType) reviewFilter.reviewType = reviewType;

    const reviews = await Review.find(reviewFilter).select('_id');
    const reviewIds = reviews.map((r) => r._id);

    const evaluations = await Evaluation.find({
      reviewId: { $in: reviewIds },
      status: 'Published'
    })
      .populate('projectId', 'projectId title')
      .populate('reviewId', 'reviewType reviewDate')
      .populate('entries.studentId', 'name student.regNo email');

    const reportData = [];

    for (const ev of evaluations) {
      for (const entry of ev.entries) {
        reportData.push({
          regNo: entry.studentId?.student?.regNo || '',
          studentName: entry.studentId?.name || '',
          projectId: ev.projectId?.projectId || '',
          projectTitle: ev.projectId?.title || '',
          reviewType: ev.reviewId?.reviewType || '',
          marks: entry.marks,
          grade: entry.grade,
          remarks: entry.remarks || ''
        });
      }
    }

    const fields = [
      { key: 'regNo', label: 'Register Number' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'projectId', label: 'Project ID' },
      { key: 'projectTitle', label: 'Project Title' },
      { key: 'reviewType', label: 'Review Type' },
      { key: 'marks', label: 'Marks Obtained' },
      { key: 'grade', label: 'Grade' },
      { key: 'remarks', label: 'Remarks' }
    ];

    return sendReportResponse(res, reportData, fields, 'Official-Marks-Sheet', format);
  } catch (err) {
    next(err);
  }
};
