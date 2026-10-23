import Settings, { getSettings } from '../models/Settings.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../models/ActivityLog.js';

export const fetchSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    return sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    const {
      collegeName,
      collegeLogoUrl,
      approvalMode,
      guideCapacityCap,
      weeklyReportDeadlineDay,
      weeklyReportDeadlineTime,
      proposalDeadline,
      reviewTypes,
      rubric,
      gradeScale,
      allowedFileTypes,
      maxFileSizeMB
    } = req.body;

    if (collegeName !== undefined) settings.collegeName = collegeName;
    if (collegeLogoUrl !== undefined) settings.collegeLogoUrl = collegeLogoUrl;
    if (approvalMode !== undefined) settings.approvalMode = approvalMode;
    if (guideCapacityCap !== undefined) settings.guideCapacityCap = guideCapacityCap;
    if (weeklyReportDeadlineDay !== undefined) settings.weeklyReportDeadlineDay = weeklyReportDeadlineDay;
    if (weeklyReportDeadlineTime !== undefined) settings.weeklyReportDeadlineTime = weeklyReportDeadlineTime;
    if (proposalDeadline !== undefined) settings.proposalDeadline = proposalDeadline;
    if (reviewTypes !== undefined) settings.reviewTypes = reviewTypes;
    if (rubric !== undefined) settings.rubric = rubric;
    if (gradeScale !== undefined) settings.gradeScale = gradeScale;
    if (allowedFileTypes !== undefined) settings.allowedFileTypes = allowedFileTypes;
    if (maxFileSizeMB !== undefined) settings.maxFileSizeMB = maxFileSizeMB;

    await settings.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'SETTINGS_UPDATED',
      entity: 'Settings',
      description: 'System-wide configuration settings updated by administrator'
    });

    return sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
};
