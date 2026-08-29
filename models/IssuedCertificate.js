import mongoose from 'mongoose';

const issuedCertificateSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CertificateRequest',
    required: true,
    unique: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  verificationToken: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  isValid: {
    type: Boolean,
    default: true
  }
});

const IssuedCertificate = mongoose.model('IssuedCertificate', issuedCertificateSchema);
export default IssuedCertificate;
