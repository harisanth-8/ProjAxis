import mongoose from 'mongoose';

const rescheduleHistorySchema = new mongoose.Schema({
  previousDate: { type: Date, required: true },
  previousVenue: { type: String, required: true },
  rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, default: '' },
  rescheduledAt: { type: Date, default: Date.now }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  reviewId: {
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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  reviewType: {
    type: String,
    required: true
  },
  reviewDate: {
    type: Date,
    required: true,
    index: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    default: '',
    trim: true
  },
  guideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  panelMemberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'],
    default: 'Scheduled',
    index: true
  },
  rescheduleHistory: [rescheduleHistorySchema]
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
