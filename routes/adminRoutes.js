import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import CertificateRequest from '../models/CertificateRequest.js';
import IssuedCertificate from '../models/IssuedCertificate.js';
import { protect, isAdminOrHod } from '../middleware/authMiddleware.js';
import { generateCertificatePdf } from '../services/pdfService.js';
import {
  sendWelcomeEmail,
  sendCertificateApprovalEmail,
  sendCertificateRejectionEmail,
  sendAccountDeactivatedEmail,
  sendAccountReactivatedEmail,
  sendAccountDeletedEmail
} from '../services/emailService.js';

const router = express.Router();

// DTO mapper helper for admin request listings
const mapToAdminRequestDTO = async (reqDoc) => {
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

// @route   GET /api/v1/admin/students
// @desc    Get all registered student profiles
router.get('/students', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const profiles = await StudentProfile.find().populate('user', 'username email department isActive');
    return res.json(profiles);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/admin/users
// @desc    Get all system users with their profiles
router.get('/users', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const result = await Promise.all(users.map(async (u) => {
      const profile = await StudentProfile.findOne({ user: u._id });
      return {
        userId: u._id,
        username: u.username,
        email: u.email,
        department: u.department,
        active: u.isActive,
        createdAt: u.createdAt,
        role: u.role,
        fullName: profile ? profile.fullName : u.username,
        enrollmentNo: profile ? profile.enrollmentNo : 'N/A',
        yearOfStudy: profile ? profile.yearOfStudy : 'N/A'
      };
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/admin/users
// @desc    Admin/HOD creates a new user
router.post('/users', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      role = 'ROLE_STUDENT',
      department = 'Computer Engineering',
      fullName,
      enrollmentNo,
      yearOfStudy = 'First Year'
    } = req.body;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already registered', success: false });
    }

    const user = new User({
      username,
      email,
      password,
      role,
      department,
      isActive: true
    });
    const savedUser = await user.save();

    let recipientName = username;
    if (role === 'ROLE_STUDENT') {
      const profile = new StudentProfile({
        user: savedUser._id,
        fullName: fullName || username,
        enrollmentNo: enrollmentNo || `ENR-${Date.now()}`,
        department,
        yearOfStudy,
        academicYear: '2025-2026'
      });
      await profile.save();
      recipientName = profile.fullName;
    }

    // Send Welcome Email
    try {
      await sendWelcomeEmail(savedUser.email, recipientName, savedUser.username);
    } catch (emailErr) {
      console.error('Welcome email dispatch warning:', emailErr.message);
    }

    return res.json({ message: 'User created successfully', success: true });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/admin/users/:userId/toggle-status
// @desc    Activate/Deactivate user account
router.put('/users/:userId/toggle-status', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    user.isActive = !user.isActive;
    await user.save();

    const reason = req.body ? req.body.reason : null;

    if (!user.isActive) {
      sendAccountDeactivatedEmail(user.email, user.username, reason);
    } else {
      sendAccountReactivatedEmail(user.email, user.username);
    }

    return res.json({
      message: `User status toggled to ${user.isActive ? 'Active' : 'Inactive'}. Notification email sent.`,
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/v1/admin/users/:userId
// @desc    Delete user and associated profile
router.delete('/users/:userId', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    const profile = await StudentProfile.findOne({ user: user._id });
    const studentName = profile?.fullName || user.username;
    const targetEmail = user.email;

    // Send Account Deleted Notification Email (await for Vercel serverless execution)
    if (targetEmail) {
      try {
        console.log(`[Admin User Delete] Triggering account deletion email to ${targetEmail} (${studentName})`);
        await sendAccountDeletedEmail(targetEmail, studentName);
      } catch (emailErr) {
        console.error('[Admin User Delete] Account deletion email error:', emailErr.message);
      }
    }

    await StudentProfile.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });

    return res.json({ message: 'User deleted successfully and notification email sent.', success: true });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/admin/requests
// @desc    Get certificate requests (filtered by department for HODs)
router.get('/requests', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const currentUser = req.user;
    const isSuperAdmin = currentUser.role === 'ROLE_ADMIN';

    let requests;
    if (isSuperAdmin || currentUser.department === 'ALL') {
      requests = await CertificateRequest.find().sort({ appliedDate: -1 }).populate('user');
    } else {
      const usersInDept = await User.find({ department: currentUser.department }).select('_id');
      const userIds = usersInDept.map(u => u._id);
      requests = await CertificateRequest.find({ user: { $in: userIds } })
        .sort({ appliedDate: -1 })
        .populate('user');
    }

    const dtos = await Promise.all(requests.map(r => mapToAdminRequestDTO(r)));
    return res.json(dtos);
  } catch (err) {
    next(err);
  }
});

// @route   POST & PUT /api/v1/admin/requests/:requestId/approve
// @desc    Approve certificate request & issue certificate
const handleApproveRequest = async (req, res, next) => {
  try {
    const request = await CertificateRequest.findById(req.params.requestId).populate('user');
    if (!request) {
      return res.status(404).json({ message: 'Request not found', success: false });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request has already been processed with status: ${request.status}`, success: false });
    }

    request.status = 'APPROVED';
    request.approvedDate = new Date();
    request.remarks = req.body?.remarks && req.body.remarks.trim() !== '' ? req.body.remarks : 'Approved by HOD';
    await request.save();

    const certNo = `CERT-${Date.now() % 1000000}`;
    const verificationToken = crypto.randomUUID();

    const issuedCert = new IssuedCertificate({
      request: request._id,
      certificateNumber: certNo,
      verificationToken,
      issueDate: new Date(),
      isValid: true
    });
    await issuedCert.save();

    // Fetch Student Profile
    let profile = await StudentProfile.findOne({ user: request.user._id });
    if (!profile) {
      profile = {
        fullName: request.user.username,
        enrollmentNo: 'N/A',
        department: request.user.department || 'Engineering',
        yearOfStudy: 'Diploma Study',
        academicYear: '2025-2026'
      };
    }

    // Generate PDF & Send Email
    try {
      const pdfBuffer = await generateCertificatePdf(issuedCert, profile, request);
      sendCertificateApprovalEmail(
        request.user.email,
        profile.fullName,
        request.purpose,
        certNo,
        pdfBuffer
      );
    } catch (pdfErr) {
      console.error('PDF Generation / Email send error:', pdfErr);
    }

    const dto = await mapToAdminRequestDTO(request);
    return res.json(dto);
  } catch (err) {
    next(err);
  }
};

router.post('/requests/:requestId/approve', protect, isAdminOrHod, handleApproveRequest);
router.put('/requests/:requestId/approve', protect, isAdminOrHod, handleApproveRequest);

// @route   PUT /api/v1/admin/requests/:requestId/reject
// @desc    Reject certificate request
router.put('/requests/:requestId/reject', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const request = await CertificateRequest.findById(req.params.requestId).populate('user');
    if (!request) {
      return res.status(404).json({ message: 'Request not found', success: false });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request has already been processed with status: ${request.status}`, success: false });
    }

    const remarks = req.body?.remarks && req.body.remarks.trim() !== ''
      ? req.body.remarks
      : 'Rejected by HOD due to incomplete documentation.';

    request.status = 'REJECTED';
    request.remarks = remarks;
    await request.save();

    const profile = await StudentProfile.findOne({ user: request.user._id });
    const studentName = profile ? profile.fullName : request.user.username;

    sendCertificateRejectionEmail(request.user.email, studentName, request.purpose, remarks);

    const dto = await mapToAdminRequestDTO(request);
    return res.json(dto);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/admin/reports/kpis
// @desc    Analytics dashboard KPI metrics
router.get('/reports/kpis', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const users = await User.find();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    const totalStudents = users.filter(u => u.role === 'ROLE_STUDENT').length;
    const totalHods = users.filter(u => u.role === 'ROLE_HOD').length;
    const totalAdmins = users.filter(u => u.role === 'ROLE_ADMIN').length;

    const deptUserMap = {};
    for (const u of users) {
      const d = u.department || 'General';
      deptUserMap[d] = (deptUserMap[d] || 0) + 1;
    }

    const allRequests = await CertificateRequest.find().populate('user');
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'PENDING').length;
    const approvedRequests = allRequests.filter(r => r.status === 'APPROVED').length;
    const rejectedRequests = allRequests.filter(r => r.status === 'REJECTED').length;

    const deptRequestMap = {};
    for (const r of allRequests) {
      const d = r.user?.department || 'General';
      deptRequestMap[d] = (deptRequestMap[d] || 0) + 1;
    }

    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    return res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalHods,
      totalAdmins,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      approvalRate: Math.round(approvalRate * 10) / 10,
      departmentUserDistribution: deptUserMap,
      departmentRequestDistribution: deptRequestMap
    });
  } catch (err) {
    next(err);
  }
});

export default router;
