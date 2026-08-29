import mongoose from 'mongoose';

const certificateRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  remarks: {
    type: String,
    default: ''
  }
});

const CertificateRequest = mongoose.model('CertificateRequest', certificateRequestSchema);
export default CertificateRequest;
