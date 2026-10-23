import mongoose from 'mongoose';

const workstreamSchema = new mongoose.Schema({
  workstreamId: {
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
    required: [true, 'Workstream title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  order: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Open', 'Completed'],
    default: 'Open',
    index: true
  }
}, { timestamps: true });

const Workstream = mongoose.model('Workstream', workstreamSchema);

export default Workstream;
