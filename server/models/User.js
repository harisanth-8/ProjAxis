import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentProfileSchema = new mongoose.Schema({
  regNo: {
    type: String,
    sparse: true,
    trim: true,
    uppercase: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  department: {
    type: String,
    trim: true
  }
}, { _id: false });

const guideProfileSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    sparse: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    trim: true
  }
}, { _id: false });

const hodProfileSchema = new mongoose.Schema({
  hodId: {
    type: String,
    sparse: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: String,
    trim: true
  }
}, { _id: false });

const panelProfileSchema = new mongoose.Schema({
  panelId: {
    type: String,
    sparse: true,
    trim: true,
    uppercase: true
  },
  designation: {
    type: String,
    trim: true
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  roles: {
    type: [String],
    enum: ['student', 'guide', 'hod', 'panel', 'admin'],
    default: ['student'],
    validate: {
      validator: (roles) => roles && roles.length > 0,
      message: 'At least one valid role is required'
    }
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Pending Approval', 'Inactive'],
    default: 'Active'
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: ''
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Subdocuments matching subclasses
  student: studentProfileSchema,
  guide: guideProfileSchema,
  hod: hodProfileSchema,
  panel: panelProfileSchema
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.passwordHash;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'student.regNo': 1 }, { unique: true, sparse: true });
userSchema.index({ 'guide.facultyId': 1 }, { unique: true, sparse: true });
userSchema.index({ 'hod.hodId': 1 }, { unique: true, sparse: true });
userSchema.index({ 'panel.panelId': 1 }, { unique: true, sparse: true });
userSchema.index({ departmentId: 1, roles: 1 });

userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

const User = mongoose.model('User', userSchema);

export default User;
