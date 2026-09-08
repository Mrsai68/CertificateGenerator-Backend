import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({ user, action, entityType, entityId = '', metadata = {}, req = null }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
    const userId = user ? (user._id || user.id) : null;
    const username = user ? user.username : 'GUEST';
    const role = user ? user.role : 'PUBLIC';

    const log = new AuditLog({
      user: userId,
      username,
      role,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress
    });

    await log.save();
  } catch (err) {
    console.error('AuditLog creation warning:', err.message);
  }
};
