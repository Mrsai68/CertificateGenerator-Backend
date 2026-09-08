import express from 'express';
import CertificateRequest from '../models/CertificateRequest.js';
import IssuedCertificate from '../models/IssuedCertificate.js';
import StudentProfile from '../models/StudentProfile.js';
import { protect, isStudent } from '../middleware/authMiddleware.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// Helper to format request response object matching Java DTO
const mapToDTO = async (reqDoc) => {
  const user = reqDoc.user;
  let fullName = user?.username || 'N/A';
  let enrollmentNo = 'N/A';
  let department = user?.department || 'Engineering';
  let yearOfStudy = 'N/A';
  let academicYear = '2025-2026';

  if (user) {
    const profile = await StudentProfile.findOne({ user: user._id || user });
    if (profile) {
      fullName = profile.fullName;
      enrollmentNo = profile.enrollmentNo;
      department = profile.department;
      yearOfStudy = profile.yearOfStudy;
      academicYear = profile.academicYear || '2025-2026';
    }
  }

  const issuedCert = await IssuedCertificate.findOne({ request: reqDoc._id });

  return {
    requestId: reqDoc._id,
    userId: user?._id || user,
    username: user?.username || 'N/A',
    fullName,
    enrollmentNo,
    department,
    yearOfStudy,
    academicYear,
    purpose: reqDoc.purpose,
    status: reqDoc.status,
    appliedDate: reqDoc.appliedDate,
    approvedDate: reqDoc.approvedDate,
    remarks: reqDoc.remarks,
    certificateNumber: issuedCert?.certificateNumber || null,
    verificationToken: issuedCert?.verificationToken || null
  };
};

// @route   POST /api/v1/requests/apply
// @desc    Student applies for a new certificate
router.post('/apply', protect, isStudent, async (req, res, next) => {
  try {
    const { purpose } = req.body;

    if (!purpose || purpose.trim() === '') {
      return res.status(400).json({ message: 'Purpose is required', success: false });
    }

    const certRequest = new CertificateRequest({
      user: req.user._id,
      purpose,
      status: 'PENDING',
      appliedDate: new Date()
    });

    const savedReq = await certRequest.save();
    const populatedReq = await CertificateRequest.findById(savedReq._id).populate('user');
    const responseDto = await mapToDTO(populatedReq);

    // Create Notification & Audit Log Entry
    await createNotification({
      userId: req.user._id,
      title: 'Certificate Request Submitted',
      message: `Your request for ${purpose} has been submitted and is under review.`,
      type: 'INFO'
    });

    await logAuditEvent({
      user: req.user,
      action: 'REQUEST_SUBMITTED',
      entityType: 'CertificateRequest',
      entityId: savedReq._id.toString(),
      metadata: { purpose },
      req
    });

    return res.json(responseDto);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/requests/my-requests
// @desc    Get current student's certificate requests
router.get('/my-requests', protect, isStudent, async (req, res, next) => {
  try {
    const requests = await CertificateRequest.find({ user: req.user._id })
      .sort({ appliedDate: -1 })
      .populate('user');

    const dtos = await Promise.all(requests.map(r => mapToDTO(r)));
    return res.json(dtos);
  } catch (err) {
    next(err);
  }
});

export default router;
