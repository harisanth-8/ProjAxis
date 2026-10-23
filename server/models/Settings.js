import mongoose from 'mongoose';

const rubricCriterionSchema = new mongoose.Schema({
  criterion: { type: String, required: true },
  maxMarks: { type: Number, required: true, default: 10 }
}, { _id: false });

const gradeScaleItemSchema = new mongoose.Schema({
  grade: { type: String, required: true },
  minPercentage: { type: Number, required: true },
  maxPercentage: { type: Number, required: true },
  description: { type: String }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  collegeName: {
    type: String,
    default: 'ProjAxis Institute of Technology'
  },
  collegeLogoUrl: {
    type: String,
    default: ''
  },
  approvalMode: {
    type: String,
    enum: ['Guide + HOD', 'Guide only'],
    default: 'Guide + HOD'
  },
  guideCapacityCap: {
    type: Number,
    default: 8,
    min: 1
  },
  weeklyReportDeadlineDay: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: 'Sunday'
  },
  weeklyReportDeadlineTime: {
    type: String,
    default: '23:59'
  },
  proposalDeadline: {
    type: Date,
    default: null
  },
  reviewTypes: {
    type: [String],
    default: ['Review 1', 'Review 2', 'Review 3', 'Final Viva', 'Guide Meeting']
  },
  rubric: {
    type: [rubricCriterionSchema],
    default: [
      { criterion: 'Problem Definition & Literature Review', maxMarks: 10 },
      { criterion: 'Methodology & System Architecture', maxMarks: 10 },
      { criterion: 'Implementation & Technical Rigor', maxMarks: 10 },
      { criterion: 'Results, Testing & Validation', maxMarks: 10 },
      { criterion: 'Presentation & Q&A Response', maxMarks: 10 }
    ]
  },
  gradeScale: {
    type: [gradeScaleItemSchema],
    default: [
      { grade: 'O', minPercentage: 90, maxPercentage: 100, description: 'Outstanding' },
      { grade: 'A+', minPercentage: 80, maxPercentage: 89.99, description: 'Excellent' },
      { grade: 'A', minPercentage: 70, maxPercentage: 79.99, description: 'Very Good' },
      { grade: 'B+', minPercentage: 60, maxPercentage: 69.99, description: 'Good' },
      { grade: 'B', minPercentage: 50, maxPercentage: 59.99, description: 'Above Average' },
      { grade: 'C', minPercentage: 40, maxPercentage: 49.99, description: 'Average' },
      { grade: 'Fail', minPercentage: 0, maxPercentage: 39.99, description: 'Fail' }
    ]
  },
  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'png', 'jpg']
  },
  maxFileSizeMB: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

/**
 * Retrieves the global singleton settings document or initializes defaults if not present.
 */
export const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

export default Settings;
