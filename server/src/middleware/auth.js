import jwt from 'jsonwebtoken';

// List of public endpoints that do not require authentication
const PUBLIC_ROUTES = [
  '/api/site-content',
  '/api/v1/site-content',
  '/api/public/stats',
  '/api/v1/public/stats',
  '/api/student/login',
  '/api/v1/student/login',
  '/student/login',
  '/login'
];

/**
 * Verifies JWT token for protected endpoints.
 * Blocks any request with missing, invalid, or forged tokens.
 */
export const verifyToken = async (req, res, next) => {
  // Check if this is an explicitly public route
  const isPublic = PUBLIC_ROUTES.some(route => req.path.startsWith(route));
  if (isPublic) {
    req.user = { uid: 'public-user', role: 'public' };
    return next();
  }

  // Require Authorization header with Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token is missing or malformed'
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Empty token provided'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'galaxy_library_super_secret_jwt_key_2026_qwerty_12345_secure_prod';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Session expired, please login again'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Invalid or forged security token'
    });
  }
};

/**
 * Role-Based Access Control: Admin Only
 * Ensures that student tokens cannot access administrative data or actions
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrative privilege required'
    });
  }
  next();
};

/**
 * Role-Based Access Control: Student Only
 */
export const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Student privilege required'
    });
  }
  next();
};

export default {
  verifyToken,
  requireAdmin,
  requireStudent
};
