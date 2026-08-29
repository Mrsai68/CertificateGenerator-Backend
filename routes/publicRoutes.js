import express from 'express';
import IssuedCertificate from '../models/IssuedCertificate.js';
import StudentProfile from '../models/StudentProfile.js';

const router = express.Router();

// @route   GET /api/v1/public/verify/:token
// @desc    Public verification of certificate authenticity by token
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const cert = await IssuedCertificate.findOne({ verificationToken: token }).populate({
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
