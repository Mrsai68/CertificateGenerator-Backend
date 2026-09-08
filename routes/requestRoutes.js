import express from 'express';
import CertificateRequest from '../models/CertificateRequest.js';
import { protect, isStudent } from '../middleware/authMiddleware.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../services/auditService.js';
import { mapToRequestDTO } from '../utils/requestDto.js';

const router = express.Router();

// Apply for certificate
router.post('/apply', protect, isStudent, async (req, res, next) => {
  try {
    const { purpose } = req.body;

    if (!purpose || !purpose.trim()) {
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
    const responseDto = await mapToRequestDTO(populatedReq);

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

// Fetch current student's requests
router.get('/my-requests', protect, isStudent, async (req, res, next) => {
  try {
    const requests = await CertificateRequest.find({ user: req.user._id })
      .sort({ appliedDate: -1 })
      .populate('user');

    const dtos = await Promise.all(requests.map(r => mapToRequestDTO(r)));
    return res.json(dtos);
  } catch (err) {
    next(err);
  }
});

export default router;
