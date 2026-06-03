import admin from 'firebase-admin';

// Initialize Firebase Admin (Requires service account credentials)
// In a real production setup, you would load this from an env variable or file
// For development without a key, we'll gracefully bypass or mock verification
try {
  // admin.initializeApp({
  //   credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
  // });
  console.log("Firebase Admin SDK initialized (Mocked/Disabled for dev unless configured)");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // If no token provided, allow the request for public endpoints
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For public endpoints (site-content, public/stats), continue without auth
    req.user = { uid: 'public-user', email: 'public@library.com' };
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Accept any token (Firebase, JWT, etc) and attach a mock user
    // In production, you'd verify the token signature here
    req.user = { uid: 'authenticated-user', email: 'admin@library.com' };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Unauthorized: Invalid token', error: error.message });
  }
};
