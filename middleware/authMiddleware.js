import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '6gpEI3BPwcEJUM0BqkeCYzkRNGBwxgLJoCueJE7VSz2');

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists', success: false });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account has been deactivated. Please contact administration.', success: false });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed', success: false });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided', success: false });
  }
};

export const isAdminOrHod = (req, res, next) => {
  if (req.user && (req.user.role === 'ROLE_ADMIN' || req.user.role === 'ROLE_HOD')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Require Admin or HOD role.', success: false });
  }
};

export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'ROLE_STUDENT') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Require Student role.', success: false });
  }
};
