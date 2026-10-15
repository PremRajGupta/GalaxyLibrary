import Request from '../models/Request.js';
import Student from '../models/Student.js';
import axios from 'axios';

export const createRequest = async (req, res) => {
  try {
    const { studentId, requestType, details, admissionData } = req.body;
    
    // Get student details
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const newRequest = new Request({
      organizationId: student.organizationId,
      branchId: student.branchId,
      studentId: student._id,
      studentDisplayId: student.studentId,
      studentName: student.name,
      requestType,
      details,
      admissionData,
      status: 'pending'
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating request', error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedRequest) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: 'Error updating request', error: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const deletedRequest = await Request.findByIdAndDelete(req.params.id);
    if (!deletedRequest) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting request', error: error.message });
  }
};

export const createPublicAdmissionRequest = async (req, res) => {
  try {
    const { details, admissionData } = req.body;
    
    // Server-side payment validation to prevent unpaid admissions
    const orderId = admissionData?.orderId;
    if (orderId && process.env.CASHFREE_PAY_CLIENT_ID) {
      const isProduction = process.env.CASHFREE_ENV === 'production' || 
        (!process.env.CASHFREE_PAY_CLIENT_ID.startsWith('TEST'));
      const baseUrl = isProduction 
        ? `https://api.cashfree.com/pg/orders/${orderId}` 
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

      try {
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
            message: 'Payment has not been completed. Admission request cannot be processed without successful payment.' 
          });
        }
      } catch (err) {
        console.error('Error verifying Cashfree order in admission submit:', err.response?.data || err.message);
        return res.status(400).json({ 
          message: 'Unable to verify payment status. Please ensure payment is completed.' 
        });
      }
    } else if (!orderId) {
      return res.status(400).json({ 
        message: 'Payment Order ID is missing. Admission request cannot be submitted without payment.' 
      });
    }

    const newRequest = new Request({
      organizationId: 'default',
      branchId: 'default',
      studentName: admissionData.name || 'New Admission',
      requestType: 'admission',
      details,
      admissionData,
      status: 'pending'
    });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating request', error: error.message });
  }
};

