import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['Proposal', 'Review', 'Feedback', 'Progress', 'Task', 'Evaluation', 'Announcement', 'System'],
    default: 'System'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Unread', 'Read'],
    default: 'Unread',
    index: true
  },
  relatedEntityType: {
    type: String,
    enum: ['Project', 'ProjectProposal', 'Review', 'ProgressReport', 'Task', 'Document', 'Evaluation', 'Announcement'],
    default: null
  },
  relatedEntityId: {
    type: String,
    default: null
  }
}, { timestamps: true });

notificationSchema.methods.markAsRead = async function () {
  this.status = 'Read';
  return await this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
