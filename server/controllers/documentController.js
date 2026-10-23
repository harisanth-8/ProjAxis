import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Project from '../models/Project.js';
import ProjectProposal from '../models/ProjectProposal.js';
import Review from '../models/Review.js';
import { getNextSequence } from '../models/Counter.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { verifyFileSignature } from '../middleware/upload.js';
import { logActivity } from '../models/ActivityLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

const checkDocumentAccess = async (user, doc) => {
  if (user.roles.includes('admin')) return true;

  if (doc.projectId) {
    const project = await Project.findById(doc.projectId);
    if (!project) return false;

    if (user.roles.includes('student')) {
      return project.studentIds.some((s) => s.toString() === user._id.toString());
    }
    if (user.roles.includes('guide')) {
      return project.guideId.toString() === user._id.toString();
    }
    if (user.roles.includes('hod')) {
      return user.departmentId && project.departmentId && user.departmentId.toString() === project.departmentId.toString();
    }
    if (user.roles.includes('panel')) {
      // Panel member has access if assigned to any review on this project
      const assignedReview = await Review.findOne({
        projectId: project._id,
        panelMemberIds: user._id
      });
      return !!assignedReview;
    }
  }

  if (doc.proposalId) {
    const proposal = await ProjectProposal.findById(doc.proposalId);
    if (!proposal) return false;

    if (user.roles.includes('student')) {
      return proposal.studentIds.some((s) => s.toString() === user._id.toString());
    }
    if (user.roles.includes('guide')) {
      return proposal.assignedGuideId && proposal.assignedGuideId.toString() === user._id.toString();
    }
    if (user.roles.includes('hod')) {
      return user.departmentId && proposal.departmentId && user.departmentId.toString() === proposal.departmentId.toString();
    }
  }

  return false;
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'NO_FILE', 'No file was uploaded');
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const validSignature = await verifyFileSignature(filePath);

    if (!validSignature) {
      return sendError(res, 400, 'INVALID_FILE_SIGNATURE', 'File signature validation failed. File may be corrupted or spoofed.');
    }

    const { projectId, proposalId, progressReportId, reviewId, category, versionGroupId } = req.body;

    if (!category) {
      fs.unlinkSync(filePath);
      return sendError(res, 400, 'MISSING_CATEGORY', 'Document category is required');
    }

    let targetProjectId = projectId || req.params.projectId;
    if (targetProjectId && !mongoose.Types.ObjectId.isValid(targetProjectId)) {
      const proj = await Project.findOne({ projectId: targetProjectId });
      if (proj) targetProjectId = proj._id;
    }

    // Verify parent authorization
    if (targetProjectId) {
      const project = await Project.findById(targetProjectId);
      if (!project) {
        fs.unlinkSync(filePath);
        return sendError(res, 404, 'NOT_FOUND', 'Target project not found');
      }
      const isStudent = project.studentIds.some((s) => s.toString() === req.user._id.toString());
      const isGuide = project.guideId.toString() === req.user._id.toString();
      const isAdmin = req.user.roles.includes('admin');
      if (!isStudent && !isGuide && !isAdmin) {
        fs.unlinkSync(filePath);
        return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to upload documents to this project');
      }
    }

    let finalGroupId = versionGroupId;
    let versionNumber = 1;

    if (finalGroupId) {
      const existingVersions = await Document.find({ versionGroupId: finalGroupId }).sort({ versionNumber: -1 });
      if (existingVersions.length > 0) {
        versionNumber = existingVersions[0].versionNumber + 1;
      }
    } else {
      finalGroupId = `GRP-${crypto.randomBytes(8).toString('hex')}`;
    }

    const seq = await getNextSequence('document');
    const documentId = `DOC-${String(seq).padStart(6, '0')}`;
    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();

    const document = await Document.create({
      documentId,
      projectId: targetProjectId || null,
      proposalId: proposalId || null,
      progressReportId: progressReportId || null,
      reviewId: reviewId || null,
      category,
      fileName: req.file.originalname,
      storedFilename: req.file.filename,
      fileType: ext,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      versionNumber,
      versionGroupId: finalGroupId
    });

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'DOCUMENT_UPLOADED',
      entity: 'Document',
      entityId: document.documentId,
      projectId: document.projectId,
      description: `Uploaded "${document.fileName}" (v${document.versionNumber}) under ${document.category}`
    });

    return sendSuccess(res, document, 201);
  } catch (err) {
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    next(err);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const rawProjectId = req.params.projectId || req.query.projectId;
    const { proposalId, category, includeDeleted = 'false' } = req.query;
    const filter = {};

    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }

    if (rawProjectId) {
      let targetProjId = rawProjectId;
      if (!mongoose.Types.ObjectId.isValid(rawProjectId)) {
        const proj = await Project.findOne({ projectId: rawProjectId });
        if (proj) targetProjId = proj._id;
      }
      filter.projectId = targetProjId;
    }
    if (proposalId) filter.proposalId = proposalId;
    if (category) filter.category = category;

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email userId roles')
      .sort({ createdAt: -1 });

    return sendSuccess(res, documents);
  } catch (err) {
    next(err);
  }
};

export const downloadDocument = async (req, res, next) => {
  try {
    let document;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      document = await Document.findById(req.params.id);
    }
    if (!document) {
      document = await Document.findOne({ documentId: req.params.id });
    }
    if (!document || document.isDeleted) {
      return sendError(res, 404, 'NOT_FOUND', 'Document not found or has been removed');
    }

    const hasAccess = await checkDocumentAccess(req.user, document);
    if (!hasAccess) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied to download this document');
    }

    const filePath = path.join(uploadDir, document.storedFilename);
    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, 'NOT_FOUND', 'File not found on storage disk');
    }

    return res.download(filePath, document.fileName);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    let document;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      document = await Document.findById(req.params.id);
    }
    if (!document) {
      document = await Document.findOne({ documentId: req.params.id });
    }
    if (!document) {
      return sendError(res, 404, 'NOT_FOUND', 'Document not found');
    }

    const isUploader = document.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isUploader && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Only the uploader or admin can delete this document');
    }

    // If linked to an active project, verify project is not already Final Submitted
    if (document.projectId) {
      const project = await Project.findById(document.projectId);
      if (project && ['Final Submitted', 'Under Evaluation', 'Completed'].includes(project.status) && !isAdmin) {
        return sendError(res, 409, 'PROJECT_FINALIZED', 'Cannot delete documents after final project submission');
      }
    }

    document.isDeleted = true;
    document.deletedAt = new Date();
    document.deletedBy = req.user._id;
    await document.save();

    await logActivity({
      actor: { userId: req.user._id, name: req.user.name, role: req.user.roles[0] },
      action: 'DOCUMENT_DELETED',
      entity: 'Document',
      entityId: document.documentId,
      projectId: document.projectId,
      description: `Soft deleted document "${document.fileName}" (v${document.versionNumber})`
    });

    return sendSuccess(res, { message: 'Document removed successfully' });
  } catch (err) {
    next(err);
  }
};
