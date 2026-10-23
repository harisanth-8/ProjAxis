import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);

export default Department;
