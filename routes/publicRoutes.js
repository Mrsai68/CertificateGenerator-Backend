import express from 'express';
import IssuedCertificate from '../models/IssuedCertificate.js';
import StudentProfile from '../models/StudentProfile.js';

const router = express.Router();

const buildVerificationResponse = async (cert) => {
  const certRequest = cert.request;
  const user = certRequest?.user;
  const profile = user ? await StudentProfile.findOne({ user: user._id }) : null;

  return {
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
  };
};

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
      return res.json({ valid: false, message: 'Document Tampered or Invalid Certificate Token.' });
    }

    const data = await buildVerificationResponse(cert);
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/verify-cert/:certNumber', async (req, res, next) => {
  try {
    const { certNumber } = req.params;
    const cert = await IssuedCertificate.findOne({ certificateNumber: certNumber }).populate({
      path: 'request',
      populate: { path: 'user' }
    });

    if (!cert || !cert.isValid) {
      return res.json({ valid: false, message: 'No active certificate found matching this Certificate ID.' });
    }

    const data = await buildVerificationResponse(cert);
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/verify-document', async (req, res, next) => {
  try {
    let { certNumber, query } = req.body;
    let targetKey = (certNumber || query || '').trim();

    if (!targetKey) {
      return res.status(400).json({ valid: false, message: 'Certificate Number or QR data is required.' });
    }

    if (targetKey.includes('/verify/')) {
      targetKey = targetKey.split('/verify/')[1];
    }

    const cert = await IssuedCertificate.findOne({
      $or: [{ certificateNumber: targetKey }, { verificationToken: targetKey }]
    }).populate({
      path: 'request',
      populate: { path: 'user' }
    });

    if (!cert || !cert.isValid) {
      return res.json({
        valid: false,
        message: 'No authentic certificate found matching this Reference Number or QR Code.'
      });
    }

    const data = await buildVerificationResponse(cert);
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
