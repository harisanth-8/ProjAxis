import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectProposal',
    required: true
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
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
  status: {
    type: String,
    enum: ['Active', 'On Hold', 'Final Submitted', 'Under Evaluation', 'Completed', 'Cancelled'],
    default: 'Active',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  academicYear: {
    type: String,
    default: () => {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Final submission details (S4)
  finalDetails: {
    finalTitle: { type: String, trim: true },
    finalAbstract: { type: String, trim: true },
    technologiesUsed: [{ type: String, trim: true }],
    repositoryUrl: { type: String, trim: true },
    submittedAt: { type: Date, default: null }
  }
}, { timestamps: true });

// Note: Progress is never stored on the project; it is dynamically computed using aggregation.

const Project = mongoose.model('Project', projectSchema);

export default Project;
