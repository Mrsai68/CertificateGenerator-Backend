import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, title, message, type = 'INFO', link = '' }) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      link
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Notification creation warning:', err.message);
    return null;
  }
};
