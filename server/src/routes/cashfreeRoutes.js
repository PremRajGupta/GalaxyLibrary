import express from 'express';
import { createPaymentOrder, generateAadhaarOtp, verifyAadhaarOtp } from '../controllers/cashfreeController.js';
import { createPublicAdmissionRequest } from '../controllers/requestController.js';
import { getAvailableSeats } from '../controllers/seatController.js';

const router = express.Router();

// Cashfree Payment
router.post('/create-order', createPaymentOrder);

// Cashfree Secure ID (Aadhaar KYC)
router.post('/kyc/aadhaar/otp', generateAadhaarOtp);
router.post('/kyc/aadhaar/verify', verifyAadhaarOtp);

// Public Seats
router.get('/seats/available', getAvailableSeats);

// Public Admission Submission
router.post('/submit-admission', createPublicAdmissionRequest);

export default router;
