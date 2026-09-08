import express from 'express';
import CertificateRequest from '../models/CertificateRequest.js';
import IssuedCertificate from '../models/IssuedCertificate.js';
import StudentProfile from '../models/StudentProfile.js';
import { generateCertificatePdf } from '../services/pdfService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/v1/certificates/download/:requestId
// @desc    Download certificate PDF (Protected with ownership check)
router.get('/download/:requestId', protect, async (req, res, next) => {
  try {
    const certRequest = await CertificateRequest.findById(req.params.requestId).populate('user');
    if (!certRequest) {
      return res.status(404).json({ message: 'Certificate request not found', success: false });
    }

    // Ownership & Permission check: Student must own request unless user is Admin or HOD
    const isOwner = req.user && req.user._id.toString() === certRequest.user._id.toString();
    const isStaff = req.user && (req.user.role === 'ROLE_ADMIN' || req.user.role === 'ROLE_HOD');

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to download this certificate.', success: false });
    }

    if (certRequest.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Certificate has not been approved yet.', success: false });
    }

    // 5-Minute Digital Wallet Security Delay Enforcement for Students
    const WALLET_DELAY_MS = 5 * 60 * 1000;
    const isStudent = req.user && req.user.role === 'ROLE_STUDENT';
    if (isStudent && certRequest.approvedDate) {
      const elapsedMs = Date.now() - new Date(certRequest.approvedDate).getTime();
      if (elapsedMs < WALLET_DELAY_MS) {
        const remainingMs = WALLET_DELAY_MS - elapsedMs;
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.ceil((remainingMs % 60000) / 1000);
        return res.status(403).json({
          message: `Digital Wallet security sync active. Your approved certificate will be available for download in ${mins}m ${secs}s.`,
          success: false
        });
      }
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
