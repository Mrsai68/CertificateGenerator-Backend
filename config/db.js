import mongoose from 'mongoose';
import User from '../models/User.js';
import CertificateRequest from '../models/CertificateRequest.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

let isConnected = false;

const seedInitialAuditLogsAndNotifications = async () => {
  try {
    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      // Seed audit logs from existing Users
      const users = await User.find();
      for (const u of users) {
        await AuditLog.create({
          user: u._id,
          username: u.username,
          role: u.role,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: u._id.toString(),
          metadata: { username: u.username, role: u.role, department: u.department },
          createdAt: u.createdAt || new Date()
        });
      }

      // Seed audit logs & notifications from existing CertificateRequests
      const requests = await CertificateRequest.find().populate('user');
      for (const req of requests) {
        if (!req.user) continue;

        await AuditLog.create({
          user: req.user._id,
          username: req.user.username,
          role: req.user.role,
          action: 'REQUEST_SUBMITTED',
          entityType: 'CertificateRequest',
          entityId: req._id.toString(),
          metadata: { purpose: req.purpose },
          createdAt: req.appliedDate || new Date()
        });

        const notifCount = await Notification.countDocuments({ user: req.user._id });
        if (notifCount === 0) {
          await Notification.create({
            user: req.user._id,
            title: 'Certificate Request Received',
            message: `Your certificate application for ${req.purpose} has been received.`,
            type: 'INFO',
            createdAt: req.appliedDate || new Date()
          });
        }

        if (req.status === 'APPROVED') {
          await AuditLog.create({
            user: req.user._id,
            username: 'HOD',
            role: 'ROLE_HOD',
            action: 'REQUEST_APPROVED',
            entityType: 'CertificateRequest',
            entityId: req._id.toString(),
            metadata: { purpose: req.purpose, remarks: req.remarks },
            createdAt: req.approvedDate || new Date()
          });

          await Notification.create({
            user: req.user._id,
            title: 'Certificate Approved & Issued! 🎉',
            message: `Your Bonafide Certificate for ${req.purpose} has been approved.`,
            type: 'SUCCESS',
            createdAt: req.approvedDate || new Date()
          });
        } else if (req.status === 'REJECTED') {
          await AuditLog.create({
            user: req.user._id,
            username: 'HOD',
            role: 'ROLE_HOD',
            action: 'REQUEST_REJECTED',
            entityType: 'CertificateRequest',
            entityId: req._id.toString(),
            metadata: { purpose: req.purpose, remarks: req.remarks },
            createdAt: req.approvedDate || new Date()
          });

          await Notification.create({
            user: req.user._id,
            title: 'Certificate Request Rejected',
            message: `Your request for ${req.purpose} was rejected. Remarks: ${req.remarks}`,
            type: 'ERROR',
            createdAt: req.approvedDate || new Date()
          });
        }
      }
    }
  } catch (err) {
    console.error('Audit log auto-seed warning:', err.message);
  }
};

export const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/certiverify';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    seedInitialAuditLogsAndNotifications();
  } catch (error) {
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        await mongoose.connect(memoryUri);
        isConnected = true;
        seedInitialAuditLogsAndNotifications();
      } catch (memError) {
        console.error('Database Connection Error:', memError.message);
      }
    } else {
      console.error('Database Connection Error:', error.message);
    }
  }
};
