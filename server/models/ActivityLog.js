import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entity: {
    type: String,
    required: true, // e.g. 'Project', 'ProjectProposal', 'Task', 'Review', 'Document'
    index: true
  },
  entityId: {
    type: String,
    default: null,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: false });

// Prevent any update or delete operations on activity log (strictly append-only)
activityLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Activity log is append-only and cannot be updated or deleted');
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export const logActivity = async ({ actor, action, entity, entityId = null, projectId = null, description, metadata = {} }) => {
  try {
    return await ActivityLog.create({
      actor,
      action,
      entity,
      entityId,
      projectId,
      description,
      metadata,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
    return null;
  }
};

export default ActivityLog;
