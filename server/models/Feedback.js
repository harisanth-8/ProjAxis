import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema({
  previousComments: { type: String, required: true },
  editedAt: { type: Date, default: Date.now }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  feedbackId: {
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
    default: null
  },
  targetType: {
    type: String,
    enum: ['Proposal', 'ProgressReport', 'Review', 'Document'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: {
    type: String,
    required: [true, 'Comments are required'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  editHistory: [editHistorySchema]
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
