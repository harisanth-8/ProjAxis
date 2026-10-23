import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Excused'],
    required: true
  },
  note: {
    type: String,
    default: '',
    trim: true
  }
}, { _id: false });

const attendanceEditHistorySchema = new mongoose.Schema({
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  editedAt: { type: Date, default: Date.now },
  reason: { type: String, default: '' },
  previousRecords: [attendanceRecordSchema]
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
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
  records: [attendanceRecordSchema],
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  editHistory: [attendanceEditHistorySchema]
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
