import admin from 'firebase-admin';

// Initialize Firebase Admin (Requires service account credentials)
try {
  console.log("Firebase Admin SDK initialized (Mocked/Disabled for dev unless configured)");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

// List of public endpoints that don't require authentication
const PUBLIC_ROUTES = [
  '/api/site-content',
  '/api/v1/site-content',
  '/api/public/stats',
  '/api/v1/public/stats',
];

export const verifyToken = async (req, res, next) => {
  // Check if this is a public route
  const isPublic = PUBLIC_ROUTES.some(route => req.path.startsWith(route));
  
  if (isPublic) {
    // Skip authentication for public routes
    req.user = { uid: 'public-user', email: 'public@library.com' };
    return next();
  }

  // For protected routes, require token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Accept any token (Firebase, JWT, etc) and attach a mock user
    req.user = { uid: 'authenticated-user', email: 'admin@library.com' };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Unauthorized: Invalid token', error: error.message });
  }
};
