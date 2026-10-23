import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  milestoneId: {
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
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Achieved', 'Missed'],
    default: 'Pending',
    index: true
  },
  achievedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
