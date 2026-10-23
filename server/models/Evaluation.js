import mongoose from 'mongoose';

const rubricScoreSchema = new mongoose.Schema({
  criterionIndex: { type: Number, required: true },
  criterion: { type: String, required: true },
  marks: { type: Number, required: true, min: 0 }
}, { _id: false });

const panelScoreEntrySchema = new mongoose.Schema({
  panelMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scores: [rubricScoreSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  comments: {
    type: String,
    default: '',
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const studentEvaluationEntrySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  panelScores: [panelScoreEntrySchema],
  marks: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    default: 'Pending'
  },
  remarks: {
    type: String,
    default: ''
  }
}, { _id: false });

const unlockHistorySchema = new mongoose.Schema({
  unlockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  unlockedAt: { type: Date, default: Date.now },
  reason: { type: String, required: true }
}, { _id: false });

const evaluationSchema = new mongoose.Schema({
  evaluationId: {
    type: String,
    required: true,
    unique: true
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true,
    unique: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  rubricSnapshot: [{
    criterion: { type: String, required: true },
    maxMarks: { type: Number, required: true }
  }],
  entries: [studentEvaluationEntrySchema],
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Published'],
    default: 'Draft',
    index: true
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  unlockHistory: [unlockHistorySchema]
}, { timestamps: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;
