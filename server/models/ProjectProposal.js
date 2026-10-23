import mongoose from 'mongoose';

const decisionHistorySchema = new mongoose.Schema({
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'guide', 'hod', 'admin'],
    required: true
  },
  decision: {
    type: String,
    enum: ['Submitted', 'Guide Assigned', 'Guide Approved', 'Revision Required', 'Approved', 'Rejected'],
    required: true
  },
  comments: {
    type: String,
    default: ''
  },
  at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const proposalVersionSchema = new mongoose.Schema({
  versionNumber: {
    type: Number,
    required: true
  },
  title: { type: String, required: true },
  domain: { type: String, required: true },
  description: { type: String, default: '' },
  problemStatement: { type: String, required: true },
  objectives: { type: String, required: true },
  methodology: { type: String, required: true },
  expectedOutcome: { type: String, required: true },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const projectProposalSchema = new mongoose.Schema({
  proposalId: {
    type: String,
    required: true,
    unique: true
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  problemStatement: {
    type: String,
    required: [true, 'Problem statement is required'],
    trim: true
  },
  objectives: {
    type: String,
    required: [true, 'Objectives are required'],
    trim: true
  },
  methodology: {
    type: String,
    required: [true, 'Methodology is required'],
    trim: true
  },
  expectedOutcome: {
    type: String,
    required: [true, 'Expected outcome is required'],
    trim: true
  },
  mentorChoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedGuideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submissionDate: {
    type: Date,
    default: null
  },
  approvalStatus: {
    type: String,
    enum: ['Draft', 'Submitted', 'With Guide', 'Guide Approved', 'Revision Required', 'Approved', 'Rejected'],
    default: 'Draft',
    index: true
  },
  decisionHistory: [decisionHistorySchema],
  versions: [proposalVersionSchema]
}, { timestamps: true });

// Validation for team size (1-4 students)
projectProposalSchema.pre('validate', function (next) {
  if (this.studentIds && this.studentIds.length > 4) {
    return next(new Error('A project team can have at most 4 students'));
  }
  if (this.mentorChoices && this.mentorChoices.length > 3) {
    return next(new Error('A project proposal can have at most 3 mentor choices'));
  }
  next();
});

const ProjectProposal = mongoose.model('ProjectProposal', projectProposalSchema);

export default ProjectProposal;
