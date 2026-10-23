import mongoose from 'mongoose';

const progressReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  weekNo: {
    type: Number,
    required: true
  },
  weekNumber: {
    type: Number
  },
  weekStartDate: {
    type: Date,
    required: true
  },
  workDone: {
    type: String,
    required: [true, 'Work done is required'],
    trim: true
  },
  plannedNext: {
    type: String,
    required: [true, 'Planned next steps are required'],
    trim: true
  },
  blockers: {
    type: String,
    default: '',
    trim: true
  },
  progress: {
    type: Number,
    required: [true, 'Team-reported progress percentage is required'],
    min: 0,
    max: 100
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed', 'Needs Attention'],
    default: 'Submitted',
    index: true
  },
  late: {
    type: Boolean,
    default: false
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Enforce one progress report per project per week
progressReportSchema.index({ projectId: 1, weekNo: 1 }, { unique: true });

const ProgressReport = mongoose.model('ProgressReport', progressReportSchema);

export default ProgressReport;
