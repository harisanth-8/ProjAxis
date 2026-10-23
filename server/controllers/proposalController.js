import mongoose from 'mongoose';
import ProjectProposal from '../models/ProjectProposal.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Settings, { getSettings } from '../models/Settings.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification, notifyMultipleUsers } from '../services/notificationService.js';
import { logActivity } from '../models/ActivityLog.js';
import { withTransaction } from '../utils/transaction.js';

export const resolveProposal = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const p = await ProjectProposal.findById(id);
    if (p) return p;
  }
  return await ProjectProposal.findOne({ proposalId: id });
};

export const createProposal = async (req, res, next) => {
  try {
    const { title, domain, description, problemStatement, objectives, methodology, expectedOutcome, mentorChoices, studentIds } = req.body;

    const team = studentIds && studentIds.length ? studentIds : [req.user._id.toString()];
    if (!team.some((id) => id.toString() === req.user._id.toString())) {
      team.push(req.user._id.toString());
    }

    // Check if any team member is already part of an active proposal or project
    const existingActiveProposal = await ProjectProposal.findOne({
      studentIds: { $in: team },
      approvalStatus: { $in: ['Submitted', 'With Guide', 'Guide Approved', 'Approved'] }
    });

    if (existingActiveProposal) {
      return sendError(
        res,
        409,
        'ACTIVE_PROPOSAL_EXISTS',
        'One or more selected team members are already associated with an active or approved proposal'
      );
    }

    const year = new Date().getFullYear();
    const seq = await getNextSequence(`PRP-${year}`);
    const proposalId = `PRP-${year}-${String(seq).padStart(4, '0')}`;

    const proposal = await ProjectProposal.create({
      proposalId,
      studentIds: team,
      departmentId: req.user.departmentId,
      title,
      domain,
      description: description || '',
      problemStatement,
      objectives,
      methodology,
      expectedOutcome,
      mentorChoices: mentorChoices || [],
      approvalStatus: 'Draft'
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PROPOSAL_DRAFTED',
      entity: 'ProjectProposal',
      entityId: proposal.proposalId,
      description: `Draft proposal created: "${proposal.title}"`
    });

    return sendSuccess(res, proposal, 201);
  } catch (err) {
    next(err);
  }
};

export const getProposals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, domain, q } = req.query;
    const filter = {};

    // Permission scoping
    if (req.user.roles.includes('admin')) {
      // Admin sees all
    } else if (req.user.roles.includes('hod')) {
      filter.departmentId = req.user.departmentId;
    } else if (req.user.roles.includes('guide')) {
      filter.$or = [
        { assignedGuideId: req.user._id },
        { mentorChoices: req.user._id }
      ];
    } else if (req.user.roles.includes('student')) {
      filter.studentIds = req.user._id;
    }

    if (status) filter.approvalStatus = status;
    if (domain) filter.domain = domain;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { proposalId: { $regex: q, $options: 'i' } },
        { domain: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await ProjectProposal.countDocuments(filter);
    const proposals = await ProjectProposal.find(filter)
      .populate('studentIds', 'name email userId student.regNo')
      .populate('assignedGuideId', 'name email userId guide.facultyId')
      .populate('mentorChoices', 'name email userId guide.facultyId')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return sendSuccess(res, proposals, 200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

export const getProposalById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) && !req.params.id.startsWith('PRP-')) {
      return sendError(res, 400, 'INVALID_ID', `Invalid identifier format: ${req.params.id}`);
    }
    let proposal = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      proposal = await ProjectProposal.findById(req.params.id)
        .populate('studentIds', 'name email userId student.regNo')
        .populate('assignedGuideId', 'name email userId guide.facultyId')
        .populate('mentorChoices', 'name email userId guide.facultyId')
        .populate('departmentId', 'name code')
        .populate('decisionHistory.by', 'name email userId roles');
    }
    if (!proposal) {
      proposal = await ProjectProposal.findOne({ proposalId: req.params.id })
        .populate('studentIds', 'name email userId student.regNo')
        .populate('assignedGuideId', 'name email userId guide.facultyId')
        .populate('mentorChoices', 'name email userId guide.facultyId')
        .populate('departmentId', 'name code')
        .populate('decisionHistory.by', 'name email userId roles');
    }

    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    // Check visibility permissions
    const isStudentMember = proposal.studentIds.some((s) => s._id.toString() === req.user._id.toString());
    const isAssignedGuide = proposal.assignedGuideId && proposal.assignedGuideId._id.toString() === req.user._id.toString();
    const isDeptHod = req.user.roles.includes('hod') && req.user.departmentId && proposal.departmentId && req.user.departmentId.toString() === proposal.departmentId._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isStudentMember && !isAssignedGuide && !isDeptHod && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to view this proposal');
    }

    return sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
};

export const updateProposal = async (req, res, next) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    // Only students of the team or admin can update
    const isMember = proposal.studentIds.some((id) => id.toString() === req.user._id.toString());
    if (!isMember && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only team members can edit this proposal');
    }

    if (proposal.approvalStatus !== 'Draft') {
      return sendError(res, 409, 'INVALID_STATE', `Cannot edit proposal in status '${proposal.approvalStatus}'. Use resubmit if revision was requested.`);
    }

    const { title, domain, description, problemStatement, objectives, methodology, expectedOutcome, mentorChoices, studentIds } = req.body;

    if (title) proposal.title = title;
    if (domain) proposal.domain = domain;
    if (description !== undefined) proposal.description = description;
    if (problemStatement) proposal.problemStatement = problemStatement;
    if (objectives) proposal.objectives = objectives;
    if (methodology) proposal.methodology = methodology;
    if (expectedOutcome) proposal.expectedOutcome = expectedOutcome;
    if (mentorChoices) proposal.mentorChoices = mentorChoices;
    if (studentIds) proposal.studentIds = studentIds;

    await proposal.save();

    return sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
};

export const submitProposal = async (req, res, next) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    const isMember = proposal.studentIds.some((id) => id.toString() === req.user._id.toString());
    if (!isMember && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only team members can submit this proposal');
    }

    if (proposal.approvalStatus !== 'Draft') {
      return sendError(res, 409, 'INVALID_STATE', `Proposal is already in '${proposal.approvalStatus}' state`);
    }

    // Create initial immutable snapshot
    const initialVersion = {
      versionNumber: 1,
      title: proposal.title,
      domain: proposal.domain,
      description: proposal.description,
      problemStatement: proposal.problemStatement,
      objectives: proposal.objectives,
      methodology: proposal.methodology,
      expectedOutcome: proposal.expectedOutcome,
      submittedAt: new Date()
    };

    proposal.approvalStatus = 'Submitted';
    proposal.submissionDate = new Date();
    proposal.versions.push(initialVersion);
    proposal.decisionHistory.push({
      by: req.user._id,
      role: 'student',
      decision: 'Submitted',
      comments: 'Proposal submitted for guide allocation and review',
      at: new Date()
    });

    await proposal.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PROPOSAL_SUBMITTED',
      entity: 'ProjectProposal',
      entityId: proposal.proposalId,
      description: `Proposal "${proposal.title}" submitted by team`
    });

    // Notify Department HOD
    const hod = await User.findOne({ departmentId: proposal.departmentId, roles: 'hod', accountStatus: 'Active' });
    if (hod) {
      await createNotification({
        recipientId: hod._id,
        category: 'Proposal',
        message: `New proposal submitted: "${proposal.title}" (ID: ${proposal.proposalId}). Guide allocation required.`,
        relatedEntityType: 'ProjectProposal',
        relatedEntityId: proposal._id.toString()
      });
    }

    return sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
};

export const assignGuide = async (req, res, next) => {
  try {
    const { guideId, overrideCapacityCap = false, overrideReason } = req.body;
    const proposal = await resolveProposal(req.params.id);

    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    // Department scope check for HOD
    if (!req.user.roles.includes('admin')) {
      if (!req.user.roles.includes('hod') || req.user.departmentId.toString() !== proposal.departmentId.toString()) {
        return sendError(res, 403, 'FORBIDDEN', 'Only the department HOD or Admin can allocate guides');
      }
    }

    if (proposal.approvalStatus !== 'Submitted') {
      return sendError(res, 409, 'INVALID_STATE', `Cannot assign guide when proposal is in '${proposal.approvalStatus}' state`);
    }

    let guide = null;
    if (mongoose.Types.ObjectId.isValid(guideId)) {
      guide = await User.findById(guideId);
    }
    if (!guide) {
      guide = await User.findOne({ userId: guideId });
    }
    if (!guide || !guide.roles.includes('guide') || guide.accountStatus !== 'Active') {
      return sendError(res, 400, 'INVALID_GUIDE', 'Specified guide does not exist or is not an active faculty guide');
    }

    // Check capacity cap
    const settings = await getSettings();
    const activeProjectCount = await Project.countDocuments({
      guideId: guide._id,
      status: { $in: ['Active', 'On Hold', 'Final Submitted', 'Under Evaluation'] }
    });

    if (activeProjectCount >= settings.guideCapacityCap && !overrideCapacityCap) {
      return sendError(
        res,
        409,
        'CAPACITY_EXCEEDED',
        `Guide ${guide.name} has reached the project capacity cap (${activeProjectCount}/${settings.guideCapacityCap}). Admin/HOD override required with reason.`
      );
    }

    proposal.assignedGuideId = guide._id;
    proposal.approvalStatus = 'With Guide';
    proposal.decisionHistory.push({
      by: req.user._id,
      role: req.user.roles.includes('admin') ? 'admin' : 'hod',
      decision: 'Guide Assigned',
      comments: overrideCapacityCap ? `Guide assigned with capacity override. Reason: ${overrideReason}` : `Guide assigned: ${guide.name}`,
      at: new Date()
    });

    await proposal.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'GUIDE_ASSIGNED',
      entity: 'ProjectProposal',
      entityId: proposal.proposalId,
      description: `Guide ${guide.name} assigned to proposal "${proposal.title}"`
    });

    // Notify Guide
    await createNotification({
      recipientId: guide._id,
      category: 'Proposal',
      message: `You have been assigned as the project guide for proposal "${proposal.title}" (ID: ${proposal.proposalId}).`,
      relatedEntityType: 'ProjectProposal',
      relatedEntityId: proposal._id.toString(),
      sendEmailNotification: true
    });

    // Notify Students
    await notifyMultipleUsers(proposal.studentIds, {
      category: 'Proposal',
      message: `Project Guide ${guide.name} has been assigned to your proposal "${proposal.title}". Status is now 'With Guide'.`,
      relatedEntityType: 'ProjectProposal',
      relatedEntityId: proposal._id.toString()
    });

    return sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
};

export const guideDecision = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;
    const proposal = await resolveProposal(req.params.id);

    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    const isAssignedGuide = proposal.assignedGuideId && proposal.assignedGuideId.toString() === req.user._id.toString();
    if (!isAssignedGuide && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only the assigned guide or admin can make this decision');
    }

    if (proposal.approvalStatus !== 'With Guide') {
      return sendError(res, 409, 'INVALID_STATE', `Guide decision is only permitted when proposal status is 'With Guide'`);
    }

    const settings = await getSettings();

    if (decision === 'Reject') {
      proposal.approvalStatus = 'Rejected';
      proposal.decisionHistory.push({
        by: req.user._id,
        role: 'guide',
        decision: 'Rejected',
        comments: comments || 'Rejected by guide',
        at: new Date()
      });
      await proposal.save();

      await notifyMultipleUsers(proposal.studentIds, {
        category: 'Proposal',
        message: `Your proposal "${proposal.title}" was rejected by the guide. Reason: ${comments}`,
        relatedEntityType: 'ProjectProposal',
        relatedEntityId: proposal._id.toString(),
        sendEmailNotification: true
      });

      return sendSuccess(res, proposal);
    }

    if (decision === 'Request Revision') {
      proposal.approvalStatus = 'Revision Required';
      proposal.decisionHistory.push({
        by: req.user._id,
        role: 'guide',
        decision: 'Revision Required',
        comments,
        at: new Date()
      });
      await proposal.save();

      await notifyMultipleUsers(proposal.studentIds, {
        category: 'Proposal',
        message: `Revisions requested for your proposal "${proposal.title}". Comments: ${comments}`,
        relatedEntityType: 'ProjectProposal',
        relatedEntityId: proposal._id.toString(),
        sendEmailNotification: true
      });

      return sendSuccess(res, proposal);
    }

    if (decision === 'Approve') {
      if (settings.approvalMode === 'Guide only') {
        // Direct transactional creation of project
        const project = await withTransaction(async (session) => {
          proposal.approvalStatus = 'Approved';
          proposal.decisionHistory.push({
            by: req.user._id,
            role: 'guide',
            decision: 'Approved',
            comments: comments || 'Approved by guide (Guide-only mode)',
            at: new Date()
          });
          await proposal.save({ session });

          const year = new Date().getFullYear();
          const seq = await getNextSequence(`PRJ-${year}`, session);
          const projectId = `PRJ-${year}-${String(seq).padStart(4, '0')}`;

          const newProj = await Project.create([{
            projectId,
            proposalId: proposal._id,
            studentIds: proposal.studentIds,
            guideId: proposal.assignedGuideId,
            departmentId: proposal.departmentId,
            title: proposal.title,
            domain: proposal.domain,
            description: proposal.description,
            status: 'Active',
            startDate: new Date(),
            academicYear: `${year}-${year + 1}`
          }], { session });

          return newProj[0];
        });

        await logActivity({
          actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
          action: 'PROJECT_CREATED',
          entity: 'Project',
          entityId: project.projectId,
          projectId: project._id,
          description: `Active Project ${project.projectId} created from approved proposal "${project.title}"`
        });

        await notifyMultipleUsers([...proposal.studentIds, proposal.assignedGuideId], {
          category: 'Proposal',
          message: `Proposal "${proposal.title}" has been approved! Project ${project.projectId} is now Active.`,
          relatedEntityType: 'Project',
          relatedEntityId: project._id.toString(),
          sendEmailNotification: true
        });

        return sendSuccess(res, { proposal, project });
      } else {
        // Guide + HOD mode: move to Guide Approved
        proposal.approvalStatus = 'Guide Approved';
        proposal.decisionHistory.push({
          by: req.user._id,
          role: 'guide',
          decision: 'Guide Approved',
          comments: comments || 'Approved by guide, awaiting HOD topic approval',
          at: new Date()
        });
        await proposal.save();

        // Notify HOD
        const hod = await User.findOne({ departmentId: proposal.departmentId, roles: 'hod', accountStatus: 'Active' });
        if (hod) {
          await createNotification({
            recipientId: hod._id,
            category: 'Proposal',
            message: `Proposal "${proposal.title}" has been Guide Approved. Final Topic Approval is pending.`,
            relatedEntityType: 'ProjectProposal',
            relatedEntityId: proposal._id.toString()
          });
        }

        return sendSuccess(res, proposal);
      }
    }
  } catch (err) {
    next(err);
  }
};

export const hodTopicApproval = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;
    const proposal = await resolveProposal(req.params.id);

    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    if (!req.user.roles.includes('admin')) {
      if (!req.user.roles.includes('hod') || req.user.departmentId.toString() !== proposal.departmentId.toString()) {
        return sendError(res, 403, 'FORBIDDEN', 'Only the department HOD or Admin can give final topic approval');
      }
    }

    if (proposal.approvalStatus !== 'Guide Approved') {
      return sendError(res, 409, 'INVALID_STATE', `HOD topic approval requires status to be 'Guide Approved'`);
    }

    let normDecision = decision;
    if (decision === 'Approve') normDecision = 'Approved';
    if (decision === 'Reject') normDecision = 'Rejected';
    if (decision === 'Request Revision') normDecision = 'Revision Required';

    if (normDecision === 'Rejected') {
      proposal.approvalStatus = 'Rejected';
      proposal.decisionHistory.push({
        by: req.user._id,
        role: 'hod',
        decision: 'Rejected',
        comments: comments || 'Rejected by HOD',
        at: new Date()
      });
      await proposal.save();

      await notifyMultipleUsers([...proposal.studentIds, proposal.assignedGuideId], {
        category: 'Proposal',
        message: `Proposal "${proposal.title}" was rejected by HOD. Reason: ${comments}`,
        relatedEntityType: 'ProjectProposal',
        relatedEntityId: proposal._id.toString(),
        sendEmailNotification: true
      });

      return sendSuccess(res, proposal);
    }

    if (normDecision === 'Revision Required') {
      proposal.approvalStatus = 'Revision Required';
      proposal.decisionHistory.push({
        by: req.user._id,
        role: 'hod',
        decision: 'Revision Required',
        comments,
        at: new Date()
      });
      await proposal.save();

      await notifyMultipleUsers([...proposal.studentIds, proposal.assignedGuideId], {
        category: 'Proposal',
        message: `HOD requested revisions for proposal "${proposal.title}". Comments: ${comments}`,
        relatedEntityType: 'ProjectProposal',
        relatedEntityId: proposal._id.toString(),
        sendEmailNotification: true
      });

      return sendSuccess(res, proposal);
    }

    if (normDecision === 'Approved') {
      const project = await withTransaction(async (session) => {
        proposal.approvalStatus = 'Approved';
        proposal.decisionHistory.push({
          by: req.user._id,
          role: 'hod',
          decision: 'Approved',
          comments: comments || 'Final topic approval granted by HOD',
          at: new Date()
        });
        await proposal.save({ session });

        const year = new Date().getFullYear();
        const seq = await getNextSequence(`PRJ-${year}`, session);
        const projectId = `PRJ-${year}-${String(seq).padStart(4, '0')}`;

        const newProj = await Project.create([{
          projectId,
          proposalId: proposal._id,
          studentIds: proposal.studentIds,
          guideId: proposal.assignedGuideId,
          departmentId: proposal.departmentId,
          title: proposal.title,
          domain: proposal.domain,
          description: proposal.description,
          status: 'Active',
          startDate: new Date(),
          academicYear: `${year}-${year + 1}`
        }], { session });

        return newProj[0];
      });

      await logActivity({
        actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
        action: 'PROJECT_CREATED',
        entity: 'Project',
        entityId: project.projectId,
        projectId: project._id,
        description: `Project ${project.projectId} initialized from approved proposal "${project.title}"`
      });

      await notifyMultipleUsers([...proposal.studentIds, proposal.assignedGuideId], {
        category: 'Proposal',
        message: `Congratulations! Proposal "${proposal.title}" received final approval. Project ${project.projectId} is now Active!`,
        relatedEntityType: 'Project',
        relatedEntityId: project._id.toString(),
        sendEmailNotification: true
      });

      return sendSuccess(res, { proposal, project });
    }
  } catch (err) {
    next(err);
  }
};

export const resubmitProposal = async (req, res, next) => {
  try {
    const proposal = await ProjectProposal.findById(req.params.id);
    if (!proposal) {
      return sendError(res, 404, 'NOT_FOUND', 'Project proposal not found');
    }

    const isMember = proposal.studentIds.some((id) => id.toString() === req.user._id.toString());
    if (!isMember && !req.user.roles.includes('admin')) {
      return sendError(res, 403, 'FORBIDDEN', 'Only team members can resubmit this proposal');
    }

    if (proposal.approvalStatus !== 'Revision Required') {
      return sendError(res, 409, 'INVALID_STATE', `Resubmission is only allowed when status is 'Revision Required'`);
    }

    const { title, domain, description, problemStatement, objectives, methodology, expectedOutcome } = req.body;

    if (title) proposal.title = title;
    if (domain) proposal.domain = domain;
    if (description !== undefined) proposal.description = description;
    if (problemStatement) proposal.problemStatement = problemStatement;
    if (objectives) proposal.objectives = objectives;
    if (methodology) proposal.methodology = methodology;
    if (expectedOutcome) proposal.expectedOutcome = expectedOutcome;

    // Create new immutable snapshot
    const nextVersionNumber = (proposal.versions.length || 0) + 1;
    proposal.versions.push({
      versionNumber: nextVersionNumber,
      title: proposal.title,
      domain: proposal.domain,
      description: proposal.description,
      problemStatement: proposal.problemStatement,
      objectives: proposal.objectives,
      methodology: proposal.methodology,
      expectedOutcome: proposal.expectedOutcome,
      submittedAt: new Date()
    });

    // Return to With Guide
    proposal.approvalStatus = 'With Guide';
    proposal.decisionHistory.push({
      by: req.user._id,
      role: 'student',
      decision: 'Submitted',
      comments: `Revision version ${nextVersionNumber} submitted by team`,
      at: new Date()
    });

    await proposal.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'PROPOSAL_RESUBMITTED',
      entity: 'ProjectProposal',
      entityId: proposal.proposalId,
      description: `Revision v${nextVersionNumber} resubmitted for "${proposal.title}"`
    });

    if (proposal.assignedGuideId) {
      await createNotification({
        recipientId: proposal.assignedGuideId,
        category: 'Proposal',
        message: `Proposal revision v${nextVersionNumber} submitted for "${proposal.title}". Please review.`,
        relatedEntityType: 'ProjectProposal',
        relatedEntityId: proposal._id.toString()
      });
    }

    return sendSuccess(res, proposal);
  } catch (err) {
    next(err);
  }
};
