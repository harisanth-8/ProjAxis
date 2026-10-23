import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  eventId: {
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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Meeting', 'Presentation', 'Deadline', 'Review', 'Other'],
    default: 'Meeting',
    index: true
  },
  startAt: {
    type: Date,
    required: [true, 'Start date/time is required'],
    index: true
  },
  endAt: {
    type: Date,
    required: [true, 'End date/time is required'],
    validate: {
      validator: function (v) {
        return this.startAt ? v > this.startAt : true;
      },
      message: 'End date and time must be after the start date and time'
    }
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participantIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'Cancelled'],
    default: 'Scheduled',
    index: true
  }
}, { timestamps: true });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);

export default CalendarEvent;
