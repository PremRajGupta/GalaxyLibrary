import axios from 'axios';

// Payment Order Generation
export const createPaymentOrder = async (req, res) => {
  try {
    const { customerPhone, customerName, orderAmount } = req.body;
    
    // Generate a unique order ID
    const orderId = `ADM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
      {
        order_amount: orderAmount ? parseFloat(orderAmount) : 5.00,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: 'cust_new',
          customer_phone: customerPhone || '9999999999',
          customer_name: customerName || 'New Student'
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
      paymentSessionId: response.data.payment_session_id
    });
  } catch (error) {
    console.error('Error creating Cashfree order:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error creating payment order', error: error.response?.data || error.message });
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
