import mongoose from 'mongoose';

const taskCommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
    default: 'Medium',
    index: true
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Under Review', 'Blocked', 'Done'],
    default: 'To Do',
    index: true
  },
  startDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  workstreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workstream',
    default: null
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    default: null
  },
  dependsOn: [{
    type: String
  }],
  comments: [taskCommentSchema],
  attachmentDocumentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }]
}, { timestamps: true });

taskSchema.index({ projectId: 1, taskId: 1 }, { unique: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
