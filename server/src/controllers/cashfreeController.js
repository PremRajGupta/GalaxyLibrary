import axios from 'axios';
import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';

// Generate next receipt number like GalaxyPR260501
const generateReceiptNumber = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `GalaxyPR${yy}${mm}`;

  const count = await Fee.countDocuments({ receiptNumber: { $regex: `^${prefix}` } });
  const seq = String(count + 1).padStart(2, '0');
  return `${prefix}${seq}`;
};

// Payment Order Generation
export const createPaymentOrder = async (req, res) => {
  try {
    const { customerPhone, customerName, customerEmail, orderAmount, returnUrl, orderPrefix } = req.body;
    
    // Generate a unique order ID
    const prefix = orderPrefix || 'ADM';
    const orderId = `${prefix}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const isProduction = process.env.CASHFREE_ENV === 'production' || 
      (Boolean(process.env.CASHFREE_PAY_CLIENT_ID) && !process.env.CASHFREE_PAY_CLIENT_ID.startsWith('TEST'));

    const baseUrl = isProduction 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const cleanPhone = customerPhone ? String(customerPhone).replace(/\D/g, '') : '';
    const safePhone = cleanPhone.length === 10 ? cleanPhone : '9999999999';
    const safeAmount = orderAmount ? parseFloat(Number(orderAmount).toFixed(2)) : 9.00;
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const response = await axios.post(
      baseUrl,
      {
        order_amount: safeAmount,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: `cust_${safePhone}_${Date.now()}`.substring(0, 45),
          customer_phone: safePhone,
          customer_name: (customerName && customerName.trim()) ? customerName.trim().substring(0, 50) : 'New Student',
          customer_email: (customerEmail && customerEmail.trim()) ? customerEmail.trim() : undefined
        },
        order_meta: {
          return_url: returnUrl || `${frontendBaseUrl}/apply?order_id={order_id}`,
          payment_methods: 'upi'
        },
        payment_methods_filters: {
          methods: {
            action: 'BLOCK',
            values: [
              'credit_card',
              'debit_card',
              'prepaid_card',
              'corporate_credit_card',
              'credit_card_emi',
              'debit_card_emi'
            ]
          }
        }
      },
      {
        headers: {
          'x-client-id': process.env.CASHFREE_PAY_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_PAY_SECRET_KEY,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    res.status(200).json({
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      environment: isProduction ? 'production' : 'sandbox'
    });
  } catch (error) {
    console.error('Error creating Cashfree order:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error creating payment order', error: error.response?.data || error.message });
  }
};

// Check Order Status
export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const isProduction = process.env.CASHFREE_ENV === 'production' || 
      (Boolean(process.env.CASHFREE_PAY_CLIENT_ID) && !process.env.CASHFREE_PAY_CLIENT_ID.startsWith('TEST'));

    const baseUrl = isProduction 
      ? `https://api.cashfree.com/pg/orders/${orderId}` 
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    const response = await axios.get(baseUrl, {
      headers: {
        'x-client-id': process.env.CASHFREE_PAY_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_PAY_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching Cashfree order status:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching order status', error: error.response?.data || error.message });
  }
};

// Generate Aadhaar OTP
export const generateAadhaarOtp = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    
    // MOCK RESPONSE FOR TESTING UI FLOW
    if (aadhaarNumber === '222222222222') {
      return res.status(200).json({
        ref_id: 'mock_ref_123456',
        status: 'SUCCESS',
        message: 'OTP sent successfully'
      });
    }

    // In actual production, you would call Cashfree's Secure ID API:
    const response = await axios.post(
      'https://sandbox.cashfree.com/verification/offline-aadhaar/otp',
      { aadhaar_number: aadhaarNumber },
      {
        headers: {
          'x-client-id': process.env.CASHFREE_SECUREID_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_SECUREID_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error generating Aadhaar OTP:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error generating Aadhaar OTP', error: error.response?.data || error.message });
  }
};

// Verify Aadhaar OTP
export const verifyAadhaarOtp = async (req, res) => {
  try {
    const { refId, otp } = req.body;
    
    // MOCK RESPONSE FOR TESTING UI FLOW
    if (refId === 'mock_ref_123456' && otp === '111000') {
      return res.status(200).json({
        ref_id: 'mock_ref_123456',
        status: 'VALID',
        message: 'Aadhaar Verified Successfully',
        care_of: 'C/O Mock Father',
        address: 'Mock Address, City, State, 123456',
        dob: '01-01-2000',
        gender: 'M',
        name: 'Mock Student Name',
        split_address: {
          country: 'India',
          dist: 'Mock District',
          house: '123',
          landmark: 'Mock Landmark',
          pincode: '123456',
          po: 'Mock PO',
          state: 'Mock State',
          street: 'Mock Street',
          subdist: 'Mock Subdist',
          vtc: 'Mock VTC'
        }
      });
    }

    const response = await axios.post(
      'https://sandbox.cashfree.com/verification/offline-aadhaar/verify',
      { ref_id: refId, otp: otp },
      {
        headers: {
          'x-client-id': process.env.CASHFREE_SECUREID_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_SECUREID_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error verifying Aadhaar OTP:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error verifying Aadhaar OTP', error: error.response?.data || error.message });
  }
};

// Record student fee payment upon verified Cashfree order
export const recordStudentFee = async (req, res) => {
  try {
    const { orderId, studentId, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Check if this Cashfree order was already processed
    const existingFee = await Fee.findOne({ notes: { $regex: orderId } });
    if (existingFee) {
      return res.status(200).json({ 
        success: true, 
        message: 'Payment already recorded', 
        fee: existingFee 
      });
    }

    // Verify order with Cashfree
    const isProduction = process.env.CASHFREE_ENV === 'production' || 
      (Boolean(process.env.CASHFREE_PAY_CLIENT_ID) && !process.env.CASHFREE_PAY_CLIENT_ID.startsWith('TEST'));

    const baseUrl = isProduction 
      ? `https://api.cashfree.com/pg/orders/${orderId}` 
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    const orderRes = await axios.get(baseUrl, {
      headers: {
        'x-client-id': process.env.CASHFREE_PAY_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_PAY_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      }
    });

    if (orderRes.data.order_status !== 'PAID') {
      return res.status(400).json({ 
        message: `Payment has not been completed. Status: ${orderRes.data.order_status}` 
      });
    }

    // Find student
    const student = await Student.findOne({
      $or: [
        { studentId: studentId },
        ...(mongoose.Types.ObjectId.isValid(studentId) ? [{ _id: studentId }] : []),
        ...(orderRes.data.customer_details?.customer_phone ? [{ mobile: orderRes.data.customer_details.customer_phone }] : [])
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found for this payment.' });
    }

    const paidAmount = Number(orderRes.data.order_amount) || Number(amount) || 0;
    const receiptNumber = await generateReceiptNumber();
    const paymentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const newFee = new Fee({
      organizationId: student.organizationId || process.env.DEFAULT_ORGANIZATION_ID || 'galaxy-library',
      branchId: student.branchId || process.env.DEFAULT_BRANCH_ID || 'main-branch',
      studentId: student._id,
      studentDisplayId: student.studentId,
      studentName: student.name,
      receiptNumber,
      amount: paidAmount,
      discountAmount: 0,
      feeCreditAmount: paidAmount,
      month: paymentMonth,
      paymentMode: 'upi',
      notes: `Online Fee Payment via Cashfree UPI (Order ID: ${orderId})`,
      paymentDate: new Date()
    });

    await newFee.save();

    res.status(201).json({
      success: true,
      message: 'Fee payment recorded successfully',
      fee: newFee
    });
  } catch (error) {
    console.error('Error recording student fee:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to record fee payment', 
      error: error.response?.data || error.message 
    });
  }
};
