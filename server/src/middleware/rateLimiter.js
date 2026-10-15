import rateLimit from 'express-rate-limit';

// 1. Global API rate limiter (protects all API routes against DDoS and request flooding)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. Strict Brute-Force Protection for Admin & Student Login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 failed login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many failed login attempts from this IP. Account access paused for 15 minutes for your security.'
  },
  skipSuccessfulRequests: true, // Only punish failed attempts
  standardHeaders: true,
  legacyHeaders: false
});

// 3. Payment Gateway (Cashfree) Order Creation Limiter (Prevents automated order spam)
export const cashfreeOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 12, // Max 12 payment session attempts per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many payment requests. Please wait a few minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. Aadhaar OTP Limiter (Prevents SMS OTP exhaustion & UIDAI charge drain)
export const aadhaarOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 OTP generations per 15 minutes
  message: {
    success: false,
    message: 'Maximum Aadhaar OTP generation limit reached for this session. Please wait 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 5. Upload Limiter for Live Photos & Documents
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40, // 40 uploads per hour
  message: {
    success: false,
    message: 'Upload limit reached. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 6. Public Landing Page Stats / Visits Limiter
export const publicVisitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  message: {
    success: false,
    message: 'Too many visit recordings.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  apiLimiter,
  loginLimiter,
  cashfreeOrderLimiter,
  aadhaarOtpLimiter,
  uploadLimiter,
  publicVisitLimiter
};
