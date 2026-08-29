import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  enrollmentNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  yearOfStudy: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  gender: {
    type: String,
    default: ''
  },
  contactNo: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
