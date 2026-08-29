import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import ResetOtpPassword from '../models/ResetOtpPassword.js';
import { sendWelcomeEmail, sendPasswordResetOtpEmail } from '../services/emailService.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '6gpEI3BPwcEJUM0BqkeCYzkRNGBwxgLJoCueJE7VSz2', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @route   POST /api/v1/auth/register
// @desc    Register a new student
router.post('/register', async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      enrollmentNo,
      EnrollmentNo,
      Name,
      name,
      fullName,
      YearOfStudy,
      yearOfStudy,
      Department,
      department,
      academicYear = '2025-2026',
      gender,
      contactNo
    } = req.body;

    const finalEnrollmentNo = enrollmentNo || EnrollmentNo || `ENR-${Date.now().toString().slice(-6)}`;
    const finalFullName = name || Name || fullName || username;
    const finalDepartment = department || Department || 'Computer Engineering';
    const finalYearOfStudy = yearOfStudy || YearOfStudy || 'First Year';

    // Check existing username & email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists', success: false });
    }

    // Check existing enrollment
    if (finalEnrollmentNo) {
      const existingProfile = await StudentProfile.findOne({ enrollmentNo: finalEnrollmentNo });
      if (existingProfile) {
        return res.status(400).json({ message: 'Enrollment number already registered', success: false });
      }
    }

    // Create User
    const user = new User({
      username,
      email,
      password,
      role: 'ROLE_STUDENT',
      department: finalDepartment,
      isActive: true
    });
    const savedUser = await user.save();

    // Create Student Profile
    const profile = new StudentProfile({
      user: savedUser._id,
      enrollmentNo: finalEnrollmentNo,
      fullName: finalFullName,
      department: finalDepartment,
      yearOfStudy: finalYearOfStudy,
      academicYear,
      gender: gender || '',
      contactNo: contactNo || ''
    });
    await profile.save();

    // Send Welcome Email
    sendWelcomeEmail(savedUser.email, profile.fullName, savedUser.username);

    return res.status(201).json({
      message: 'Student registered successfully!',
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/auth/userreg
// @desc    Register HOD or Admin user
router.post('/userreg', async (req, res, next) => {
  try {
    const { username, password, Department, department } = req.body;
    const finalDept = department || Department || 'Computer Engineering';

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken', success: false });
    }

    const user = new User({
      username,
      email: `${username.toLowerCase()}@gpmiraj.ac.in`,
      password,
      role: 'ROLE_HOD',
      department: finalDept,
      isActive: true
    });
    await user.save();

    return res.json({
      message: 'HOD User created successfully!',
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password', success: false });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.', success: false });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password', success: false });
    }

    const token = generateToken(user._id);

    // Fetch profile if student
    let fullName = user.username;
    let enrollment = 'N/A';
    const profile = await StudentProfile.findOne({ user: user._id });
    if (profile) {
      fullName = profile.fullName;
      enrollment = profile.enrollmentNo;
    }

    return res.json({
      accessToken: token,
      username: user.username,
      role: user.role,
      department: user.department,
      enrollment,
      fullName
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/auth/email/:emailId
// @desc    Get basic user info by email
router.get('/email/:emailId', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.params.emailId.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    return res.json({
      username: user.username,
      email: user.email,
      role: user.role,
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/auth/forget-password
// @desc    Request password reset OTP email
router.post('/forget-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email.', success: false });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const otpLog = new ResetOtpPassword({
      email: user.email,
      otpCode,
      expiryTime,
      isUsed: false
    });
    await otpLog.save();

    // Dispatch OTP Email
    sendPasswordResetOtpEmail(user.email, otpCode);

    return res.json({
      message: 'OTP Code sent to your registered email.',
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/auth/reset-password
// @desc    Verify OTP and set new password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    const otpRecord = await ResetOtpPassword.findOne({
      email: email.toLowerCase(),
      otpCode,
      isUsed: false,
      expiryTime: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code.', success: false });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    user.password = newPassword;
    await user.save();

    otpRecord.isUsed = true;
    await otpRecord.save();

    return res.json({
      message: 'Password reset successfully! You can now login.',
      success: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
