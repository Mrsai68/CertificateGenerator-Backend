import mongoose from 'mongoose';

const resetOtpPasswordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otpCode: {
    type: String,
    required: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResetOtpPassword = mongoose.model('ResetOtpPassword', resetOtpPasswordSchema);
export default ResetOtpPassword;
