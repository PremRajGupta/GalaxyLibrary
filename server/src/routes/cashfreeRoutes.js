import express from 'express';
import { createPaymentOrder, getOrderStatus, generateAadhaarOtp, verifyAadhaarOtp } from '../controllers/cashfreeController.js';
import { createPublicAdmissionRequest } from '../controllers/requestController.js';
import { getAvailableSeats } from '../controllers/seatController.js';

import { cashfreeOrderLimiter, aadhaarOtpLimiter, uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Cashfree Payment
router.post('/create-order', cashfreeOrderLimiter, createPaymentOrder);
router.get('/order-status/:orderId', getOrderStatus);

// Cashfree Secure ID (Aadhaar KYC)
router.post('/kyc/aadhaar/otp', aadhaarOtpLimiter, generateAadhaarOtp);
router.post('/kyc/aadhaar/verify', verifyAadhaarOtp);

// Public Seats
router.get('/seats/available', getAvailableSeats);

// Public Admission Submission
router.post('/submit-admission', uploadLimiter, createPublicAdmissionRequest);

export default router;
