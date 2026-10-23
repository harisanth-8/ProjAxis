import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
    index: true
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectProposal',
    default: null,
    index: true
  },
  progressReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgressReport',
    default: null
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    default: null
  },
  category: {
    type: String,
    enum: ['Proposal', 'Report', 'Presentation', 'Source Code', 'Other'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  storedFilename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  versionNumber: {
    type: Number,
    default: 1
  },
  versionGroupId: {
    type: String,
    required: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

export default Document;
