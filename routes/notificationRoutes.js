import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/v1/notifications
// @desc    Get logged in user's notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    return res.json({
      notifications,
      unreadCount,
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/v1/notifications/:id/read
// @desc    Mark a notification as read
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found', success: false });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ message: 'Notification marked as read', success: true });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/v1/notifications/read-all
// @desc    Mark all user notifications as read
router.patch('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return res.json({ message: 'All notifications marked as read', success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
