import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, isAdminOrHod } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/v1/audit-logs
// @desc    Get system audit logs (Admin only)
router.get('/', protect, isAdminOrHod, async (req, res, next) => {
  try {
    const { action, role, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (action && action !== 'ALL') {
      query.action = action;
    }
    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { username: { $regex: q, $options: 'i' } },
        { action: { $regex: q, $options: 'i' } },
        { entityType: { $regex: q, $options: 'i' } },
        { entityId: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.json({
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      success: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
