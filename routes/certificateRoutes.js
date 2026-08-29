import express from 'express';
import CertificateRequest from '../models/CertificateRequest.js';
import IssuedCertificate from '../models/IssuedCertificate.js';
import StudentProfile from '../models/StudentProfile.js';
import { generateCertificatePdf } from '../services/pdfService.js';

const router = express.Router();

// @route   GET /api/v1/certificates/download/:requestId
// @desc    Download certificate PDF
router.get('/download/:requestId', async (req, res, next) => {
  try {
    const certRequest = await CertificateRequest.findById(req.params.requestId).populate('user');
    if (!certRequest) {
      return res.status(404).json({ message: 'Certificate request not found', success: false });
    }

    if (certRequest.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Certificate has not been approved yet.', success: false });
    }

    const issuedCert = await IssuedCertificate.findOne({ request: certRequest._id });
    if (!issuedCert) {
      return res.status(404).json({ message: 'Issued certificate record not found', success: false });
    }

    let profile = await StudentProfile.findOne({ user: certRequest.user._id });
    if (!profile) {
      profile = {
        fullName: certRequest.user.username,
        enrollmentNo: 'N/A',
        department: certRequest.user.department || 'Engineering',
        yearOfStudy: 'Diploma Study',
        academicYear: '2025-2026'
      };
    }

    const pdfBuffer = await generateCertificatePdf(issuedCert, profile, certRequest);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Bonafide_Certificate_${req.params.requestId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
