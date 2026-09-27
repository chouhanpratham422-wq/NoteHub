import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  console.log('========================================');
  console.log('AUTH CHECK');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log(
    'Authorization header received:',
    authorizationHeader ? 'YES' : 'NO'
  );

  if (authorizationHeader) {
    console.log(
      'Authorization starts with Bearer:',
      authorizationHeader.startsWith('Bearer ')
    );
  }

  console.log('========================================');

  if (
    authorizationHeader &&
    authorizationHeader.startsWith('Bearer ')
  ) {
    try {
      const token = authorizationHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message:
            'Not authorized, empty token provided.',
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          'notehub_default_secret_key_change_in_production'
      );

      req.user = await User.findById(
        decoded.id
      ).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            'The user belonging to this token no longer exists.',
        });
      }

      console.log(
        'Authenticated user:',
        req.user.email,
        '| Role:',
        req.user.role
      );

      return next();

    } catch (error) {
      console.error(
        'JWT verification error:',
        error.message
      );

      return res.status(401).json({
        success: false,
        message:
          'Not authorized, token failed or expired.',
      });
    }
  }

  return res.status(401).json({
    success: false,
    message:
      'Not authorized, no token provided. Please log in.',
  });
};

export const admin = (req, res, next) => {
  if (
    req.user &&
    req.user.role === 'admin'
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      'You are not authorized to perform this action. Admin access required.',
  });
};