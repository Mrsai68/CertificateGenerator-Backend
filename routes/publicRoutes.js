import express from 'express';
import IssuedCertificate from '../models/IssuedCertificate.js';
import StudentProfile from '../models/StudentProfile.js';

const router = express.Router();

// @route   GET /api/v1/public/verify/:token
// @desc    Public verification of certificate authenticity by token
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const cert = await IssuedCertificate.findOne({
      $or: [{ verificationToken: token }, { certificateNumber: token }]
    }).populate({
      path: 'request',
      populate: { path: 'user' }
    });

    if (!cert || !cert.isValid) {
      return res.json({
        valid: false,
        message: 'Document Tampered or Invalid Certificate Token.'
      });
    }

    const certRequest = cert.request;
    const user = certRequest?.user;

    const profile = user ? await StudentProfile.findOne({ user: user._id }) : null;

    return res.json({
      valid: true,
      message: 'Authentic Bonafide Certificate Verified!',
      certificateNumber: cert.certificateNumber,
      verificationToken: cert.verificationToken,
      fullName: profile ? profile.fullName : (user ? user.username : 'N/A'),
      enrollmentNo: profile ? profile.enrollmentNo : 'N/A',
      department: profile ? profile.department : (user ? user.department : 'Engineering'),
      yearOfStudy: profile ? profile.yearOfStudy : 'Diploma Study',
      academicYear: profile ? profile.academicYear : '2025-2026',
      purpose: certRequest ? certRequest.purpose : 'Official',
      issueDate: cert.issueDate
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/public/verify-cert/:certNumber
// @desc    Public verification by Certificate Reference Number
router.get('/verify-cert/:certNumber', async (req, res, next) => {
  try {
    const { certNumber } = req.params;

    const cert = await IssuedCertificate.findOne({ certificateNumber: certNumber }).populate({
      path: 'request',
      populate: { path: 'user' }
    });

    if (!cert || !cert.isValid) {
      return res.json({
        valid: false,
        message: 'No active certificate found matching this Certificate ID.'
      });
    }

    const certRequest = cert.request;
    const user = certRequest?.user;
    const profile = user ? await StudentProfile.findOne({ user: user._id }) : null;

    return res.json({
      valid: true,
      message: 'Authentic Bonafide Certificate Verified!',
      certificateNumber: cert.certificateNumber,
      verificationToken: cert.verificationToken,
      fullName: profile ? profile.fullName : (user ? user.username : 'N/A'),
      enrollmentNo: profile ? profile.enrollmentNo : 'N/A',
      department: profile ? profile.department : (user ? user.department : 'Engineering'),
      yearOfStudy: profile ? profile.yearOfStudy : 'Diploma Study',
      academicYear: profile ? profile.academicYear : '2025-2026',
      purpose: certRequest ? certRequest.purpose : 'Official',
      issueDate: cert.issueDate
    });
  } catch (err) {
    next(err);
  }
});

export default router;
