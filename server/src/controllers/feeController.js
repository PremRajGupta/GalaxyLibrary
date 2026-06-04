import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { getCourseLabel } from '../utils/courseOptions.js';
import { getStudentDisplayId } from '../utils/studentDisplayId.js';

/** Generate next receipt number like GalaxyPR260501, GalaxyPR260502, ... */
const generateReceiptNumber = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `GalaxyPR${yy}${mm}`;

  // Count existing receipts for this YYMM period
  const count = await Fee.countDocuments({ receiptNumber: { $regex: `^${prefix}` } });
  const seq = String(count + 1).padStart(2, '0');
  return `${prefix}${seq}`;
};

export const getFees = async (req, res) => {
  try {
    const fees = await Fee.find().sort({ createdAt: -1 }).lean();
    const studentIds = [...new Set(fees.map((fee) => fee.studentDisplayId).filter(Boolean))];
    const students = await Student.find({ studentId: { $in: studentIds } })
      .select('studentId course seatNumber fatherName mobile joiningDate admissionDate')
      .lean();
    const studentsByDisplayId = new Map(students.map((student) => [student.studentId, student]));

    const normalizedFees = fees.map((fee) => {
      const student = studentsByDisplayId.get(fee.studentDisplayId);
      const displayId = getStudentDisplayId(fee) || fee.studentDisplayId;

      return {
        ...fee,
        studentDisplayId: displayId,
        studentId: displayId,
        receiptNumber: fee.receiptNumber || String(fee._id),
        course: getCourseLabel(student?.course),
        seatNumber: student?.seatNumber,
        fatherName: student?.fatherName,
        studentMobile: student?.mobile,
        joiningDate: student?.joiningDate || student?.admissionDate,
        date: fee.paymentDate
          ? new Date(fee.paymentDate).toISOString().split('T')[0]
          : undefined,
      };
    });

    res.status(200).json(normalizedFees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

export const createFee = async (req, res) => {
  try {
    const { studentDisplayId, amount, month, paymentMode, notes } = req.body;
    
    // Find the actual student ObjectId based on display ID
    const student = await Student.findOne({ studentId: studentDisplayId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found with provided ID' });
    }

    const receiptNumber = await generateReceiptNumber();

    const newFee = new Fee({
      organizationId: student.organizationId || process.env.DEFAULT_ORGANIZATION_ID || 'galaxy-library',
      branchId: student.branchId || process.env.DEFAULT_BRANCH_ID || 'main-branch',
      studentId: student._id,
      studentDisplayId,
      studentName: student.name,
      receiptNumber,
      amount,
      month,
      paymentMode,
      notes
    });

    await newFee.save();
    res.status(201).json(newFee);
  } catch (error) {
    res.status(400).json({ message: 'Error creating fee', error: error.message });
  }
};

export const updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, month, paymentMode, notes, paymentDate } = req.body;

    const updateFields = {};
    if (amount !== undefined) updateFields.amount = amount;
    if (month !== undefined) updateFields.month = month;
    if (paymentMode !== undefined) updateFields.paymentMode = paymentMode;
    if (notes !== undefined) updateFields.notes = notes;
    if (paymentDate !== undefined) updateFields.paymentDate = paymentDate;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { receiptNumber: id }] }
      : { receiptNumber: id };

    const fee = await Fee.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.status(200).json(fee);
  } catch (error) {
    res.status(400).json({ message: 'Error updating fee', error: error.message });
  }
};

/**
 * Mark a payment as advance and calculate validity period
 * POST /api/fees/:id/mark-advance
 * Body: { monthlyFee: number, advanceStartDate: string (ISO), isAdvance: boolean }
 */
export const markAdvancePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { monthlyFee, advanceStartDate, isAdvance, advanceAmount } = req.body;

    if (!monthlyFee || monthlyFee <= 0) {
      return res.status(400).json({ message: 'Valid monthly fee is required' });
    }

    // Find the fee
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { receiptNumber: id }] }
      : { receiptNumber: id };

    const fee = await Fee.findOne(query);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (!isAdvance) {
      // Remove advance marking
      fee.isAdvancePayment = false;
      fee.monthlyFee = null;
      fee.monthsCovered = null;
      fee.validUntilDate = null;
      fee.advanceStartDate = null;
      await fee.save();
      return res.status(200).json(fee);
    }

    // Calculate months covered using advanceAmount if provided, otherwise use full payment amount
    const amountToUse = advanceAmount !== undefined ? advanceAmount : fee.amount;
    const monthsCovered = Math.floor(amountToUse / monthlyFee);

    // Calculate validity end date - keep the same day of month
    const startDate = advanceStartDate ? new Date(advanceStartDate) : new Date(fee.paymentDate || Date.now());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsCovered);

    // Update fee with advance information
    fee.isAdvancePayment = true;
    fee.monthlyFee = monthlyFee;
    fee.monthsCovered = monthsCovered;
    fee.validUntilDate = endDate;
    fee.advanceStartDate = new Date(startDate);

    await fee.save();
    res.status(200).json(fee);
  } catch (error) {
    res.status(400).json({ message: 'Error marking advance payment', error: error.message });
  }
};

/**
 * Get student payment validity information
 * GET /api/students/:studentDisplayId/payment-validity
 */
export const getStudentPaymentValidity = async (req, res) => {
  try {
    const { studentDisplayId } = req.params;

    // Find the student
    const student = await Student.findOne({ studentId: studentDisplayId })
      .select('studentId name feeAmount joiningDate admissionDate');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get latest advance payment
    const latestAdvance = await Fee.findOne(
      {
        studentDisplayId,
        isAdvancePayment: true
      },
      null,
      { sort: { createdAt: -1 } }
    );

    if (!latestAdvance) {
      return res.status(200).json({
        hasAdvancePayment: false,
        monthsCovered: 0,
        validUntilDate: null,
        daysRemaining: 0,
        paymentStatus: 'no-advance'
      });
    }

    // Calculate days remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validUntil = new Date(latestAdvance.validUntilDate);
    validUntil.setHours(0, 0, 0, 0);
    const daysRemaining = Math.floor((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let paymentStatus = 'valid';
    if (daysRemaining < 0) {
      paymentStatus = 'expired';
    } else if (daysRemaining <= 15) {
      paymentStatus = 'expiring-soon';
    }

    res.status(200).json({
      hasAdvancePayment: true,
      monthsCovered: latestAdvance.monthsCovered || 0,
      validUntilDate: latestAdvance.validUntilDate ? new Date(latestAdvance.validUntilDate).toISOString().split('T')[0] : null,
      advanceStartDate: latestAdvance.advanceStartDate ? new Date(latestAdvance.advanceStartDate).toISOString().split('T')[0] : null,
      daysRemaining: Math.max(0, daysRemaining),
      paymentStatus,
      receiptNumber: latestAdvance.receiptNumber,
      amount: latestAdvance.amount,
      paymentDate: latestAdvance.paymentDate ? new Date(latestAdvance.paymentDate).toISOString().split('T')[0] : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment validity', error: error.message });
  }
};
