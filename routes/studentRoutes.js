import express from 'express';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { protect, isStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/v1/student/profile
// @desc    Get current student profile details
router.get('/profile', protect, isStudent, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      // Auto-create default profile if missing
      profile = new StudentProfile({
        user: req.user._id,
        enrollmentNo: `ENR-${Date.now().toString().slice(-6)}`,
        fullName: user.username,
        department: user.department || 'Computer Engineering',
        yearOfStudy: 'First Year',
        academicYear: '2025-2026'
      });
      await profile.save();
    }

    return res.json({
      userId: user._id,
      username: user.username,
      email: user.email,
      fullName: profile.fullName || user.username,
      enrollmentNo: profile.enrollmentNo || 'N/A',
      department: profile.department || user.department || 'Computer Engineering',
      yearOfStudy: profile.yearOfStudy || 'First Year',
      academicYear: profile.academicYear || '2025-2026',
      gender: profile.gender || '',
      contactNo: profile.contactNo || '',
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/student/profile
// @desc    Update current student profile details
router.put('/profile', protect, isStudent, async (req, res, next) => {
  try {
    const { fullName, enrollmentNo, department, yearOfStudy, academicYear, gender, contactNo } = req.body;

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user._id });
    }

    if (fullName) profile.fullName = fullName.trim();
    if (enrollmentNo) profile.enrollmentNo = enrollmentNo.trim();
    if (department) profile.department = department.trim();
    if (yearOfStudy) profile.yearOfStudy = yearOfStudy.trim();
    if (academicYear) profile.academicYear = academicYear.trim();
    if (gender !== undefined) profile.gender = gender;
    if (contactNo !== undefined) profile.contactNo = contactNo;

    await profile.save();

    // Also update department on User model
    if (department) {
      await User.findByIdAndUpdate(req.user._id, { department: department.trim() });
    }

    return res.json({
      message: 'Profile updated successfully!',
      fullName: profile.fullName,
      enrollmentNo: profile.enrollmentNo,
      department: profile.department,
      yearOfStudy: profile.yearOfStudy,
      academicYear: profile.academicYear,
      gender: profile.gender,
      contactNo: profile.contactNo,
      success: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
