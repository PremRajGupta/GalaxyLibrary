import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { getCourseLabel } from '../utils/courseOptions.js';
import { getStudentDisplayId } from '../utils/studentDisplayId.js';
import { parseDateInputValue } from '../utils/feeDues.js';

const EXPIRING_SOON_DAYS = 15;

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
    const { registrationType, month } = req.query;
    let feeQuery = {};
    if (month && month !== 'all') {
      feeQuery.month = month;
    }
    const fees = await Fee.find(feeQuery).sort({ createdAt: -1 }).lean();
    const studentIds = [...new Set(fees.map((fee) => fee.studentDisplayId).filter(Boolean))];
    const studentQuery = { studentId: { $in: studentIds } };
    if (registrationType && registrationType !== 'all') {
      studentQuery.registrationType = registrationType;
    }
    const students = await Student.find(studentQuery)
      .select('studentId course seatNumber fatherName mobile joiningDate admissionDate registrationType')
      .lean();
    const studentsByDisplayId = new Map(students.map((student) => [student.studentId, student]));

    const normalizedFees = fees.reduce((acc, fee) => {
      const student = studentsByDisplayId.get(fee.studentDisplayId);
      // If filtering by registrationType and student doesn't match, skip
      if (registrationType && registrationType !== 'all' && !student) return acc;

      const displayId = getStudentDisplayId(fee) || fee.studentDisplayId;

      acc.push({
        ...fee,
        studentDisplayId: displayId,
        studentId: displayId,
        receiptNumber: fee.receiptNumber || String(fee._id),
        course: getCourseLabel(student?.course),
        seatNumber: student?.seatNumber,
        fatherName: student?.fatherName,
        studentMobile: student?.mobile,
        joiningDate: student?.joiningDate || student?.admissionDate,
        registrationType: student?.registrationType || 'library',
        date: fee.paymentDate
          ? new Date(fee.paymentDate).toISOString().split('T')[0]
          : undefined,
      });
      return acc;
    }, []);

    res.status(200).json(normalizedFees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

export const createFee = async (req, res) => {
  try {
    const { studentDisplayId, amount, discountAmount, feeCreditAmount, month, paymentMode, notes } = req.body;
    
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
      discountAmount: Math.max(0, Number(discountAmount) || 0),
      feeCreditAmount: Math.max(0, Number(feeCreditAmount ?? amount) || 0),
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

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { receiptNumber: id }] }
      : { receiptNumber: id };

    const fee = await Fee.findOne(query);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (amount !== undefined) {
      fee.amount = amount;
      fee.feeCreditAmount = amount; // Sync credit amount with edited amount
    }
    if (month !== undefined) fee.month = month;
    if (paymentMode !== undefined) fee.paymentMode = paymentMode;
    if (notes !== undefined) fee.notes = notes;
    if (paymentDate !== undefined) fee.paymentDate = paymentDate;

    // If it's an advance payment, recalculate validity
    if (fee.isAdvancePayment && fee.monthlyFee > 0 && fee.advanceStartDate) {
      const startDate = toDateOnly(fee.advanceStartDate);
      if (startDate) {
        const { monthsCovered, validUntil } = calculateValidityFromAmount(startDate, fee.amount, fee.monthlyFee);
        fee.monthsCovered = monthsCovered;
        fee.validUntilDate = validUntil;
      }
    }

    await fee.save();
    res.status(200).json(fee);
  } catch (error) {
    res.status(400).json({ message: 'Error updating fee', error: error.message });
  }
};

const toDateOnly = (value) => {
  if (!value) return null;
  const parsedInput = value instanceof Date
    ? parseDateInputValue(value.toISOString())
    : parseDateInputValue(value);
  const parsed = parsedInput ? new Date(parsedInput) : null;
  if (!parsed) return null;
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const formatDateOnly = (value) => {
  const date = value instanceof Date ? new Date(value) : toDateOnly(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addBillingMonths = (startDate, months) => {
  const wholeMonths = Math.max(0, Math.floor(months));
  const originalDay = startDate.getDate();
  const endDate = new Date(startDate);
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(1);
  endDate.setMonth(endDate.getMonth() + wholeMonths);
  const lastDayOfTargetMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
  endDate.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return endDate;
};

const getBillablePeriodCount = (startDate, asOf) => {
  if (asOf < startDate) return 0;
  let count = 0;
  while (addBillingMonths(startDate, count) <= asOf) {
    count += 1;
  }
  return count;
};

const calculateValidityFromAmount = (startDate, amount, monthlyFee) => {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safeMonthlyFee = Math.max(0, Number(monthlyFee) || 0);
  if (!safeMonthlyFee) {
    return {
      monthsCovered: 0,
      validUntil: new Date(startDate),
    };
  }

  const fullMonthsCovered = Math.floor(safeAmount / safeMonthlyFee);
  const validUntil = addBillingMonths(startDate, fullMonthsCovered);
  
  const partialAmount = safeAmount % safeMonthlyFee;
  if (partialAmount > 0) {
    const nextMonth = addBillingMonths(startDate, fullMonthsCovered + 1);
    const msInDay = 1000 * 60 * 60 * 24;
    const totalDaysInMonth = Math.round((nextMonth - validUntil) / msInDay);
    const extraDays = Math.round((partialAmount / safeMonthlyFee) * totalDaysInMonth);
    validUntil.setDate(validUntil.getDate() + extraDays);
  }

  return {
    monthsCovered: Number((safeAmount / safeMonthlyFee).toFixed(2)),
    validUntil,
  };
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
    const startDate = toDateOnly(advanceStartDate || fee.paymentDate || new Date());
    if (!startDate) {
      return res.status(400).json({ message: 'Valid advance start date is required' });
    }
    const { monthsCovered, validUntil } = calculateValidityFromAmount(startDate, amountToUse, monthlyFee);

    // Update fee with advance information
    fee.isAdvancePayment = true;
    fee.monthlyFee = monthlyFee;
    fee.monthsCovered = monthsCovered;
    fee.validUntilDate = validUntil;
    fee.advanceStartDate = startDate;

    await fee.save();
    res.status(200).json(fee);
  } catch (error) {
    res.status(400).json({ message: 'Error marking advance payment', error: error.message });
  }
};

/**
 * Compute payment validity details for a single student in-memory
 */
export const computeStudentValidity = (student, feeRecords = [], today = new Date()) => {
  const monthlyFee = Number(student?.feeAmount) || 0;
  const startDate = toDateOnly(student?.joiningDate || student?.admissionDate);
  const hasHistory = feeRecords && feeRecords.length > 0;

  if (!monthlyFee || monthlyFee <= 0 || !startDate) {
    return {
      hasPaymentHistory: hasHistory,
      hasAdvancePayment: false,
      isAdvancePayment: false,
      monthsCovered: 0,
      validUntilDate: null,
      advanceStartDate: null,
      advanceValidUntilDate: null,
      daysRemaining: 0,
      paymentStatus: 'no-payment',
      monthlyFee,
    };
  }

  const totalPaid = feeRecords.reduce((sum, fee) => {
    const feeCredit = fee.feeCreditAmount !== undefined ? fee.feeCreditAmount : fee.amount;
    return sum + (Number(feeCredit) || 0);
  }, 0);
  const { monthsCovered, validUntil } = calculateValidityFromAmount(startDate, totalPaid, monthlyFee);

  if (monthsCovered <= 0) {
    return {
      hasPaymentHistory: totalPaid > 0,
      hasAdvancePayment: false,
      isAdvancePayment: false,
      monthsCovered: 0,
      validUntilDate: null,
      advanceStartDate: null,
      advanceValidUntilDate: null,
      daysRemaining: 0,
      paymentStatus: 'no-payment',
      monthlyFee,
      totalPaid,
    };
  }

  const daysRemaining = Math.floor((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let paymentStatus = 'valid';
  if (daysRemaining < 0) {
    paymentStatus = 'expired';
  } else if (daysRemaining <= EXPIRING_SOON_DAYS) {
    paymentStatus = 'expiring-soon';
  }

  const currentPeriodCount = getBillablePeriodCount(startDate, today);
  const advanceMonths = Math.max(0, monthsCovered - currentPeriodCount);
  const hasComputedAdvance = advanceMonths > 0;
  const advanceStartDate = hasComputedAdvance ? addBillingMonths(startDate, currentPeriodCount) : null;
  const latestMarkedAdvance = feeRecords
    .filter((fee) => fee.isAdvancePayment)
    .sort((a, b) => new Date(b.createdAt || b.paymentDate || 0).getTime() - new Date(a.createdAt || a.paymentDate || 0).getTime())[0];
  const latestFeeRecord = feeRecords[feeRecords.length - 1];

  return {
    hasPaymentHistory: true,
    hasAdvancePayment: hasComputedAdvance,
    isAdvancePayment: hasComputedAdvance,
    monthsCovered,
    advanceMonths,
    validUntilDate: formatDateOnly(validUntil),
    advanceStartDate: formatDateOnly(advanceStartDate),
    advanceValidUntilDate: hasComputedAdvance ? formatDateOnly(validUntil) : null,
    daysRemaining: Math.max(0, daysRemaining),
    rawDaysRemaining: daysRemaining,
    paymentStatus,
    receiptNumber: latestMarkedAdvance?.receiptNumber || latestFeeRecord?.receiptNumber,
    amount: latestFeeRecord?.amount || 0,
    totalPaid,
    monthlyFee,
    paymentDate: formatDateOnly(latestFeeRecord?.paymentDate),
  };
};

/**
 * Get student payment validity information
 * GET /api/fees/student/:studentDisplayId/validity
 */
export const getStudentPaymentValidity = async (req, res) => {
  try {
    const { studentDisplayId } = req.params;

    // Find the student
    const student = await Student.findOne({ studentId: studentDisplayId })
      .select('studentId name feeAmount joiningDate admissionDate')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const feeRecords = await Fee.find({ studentDisplayId }).sort({ paymentDate: 1, createdAt: 1 }).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = computeStudentValidity(student, feeRecords, today);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment validity', error: error.message });
  }
};

/**
 * Get bulk payment validity information for all or specified students in a SINGLE fast query
 * GET /api/fees/validity/bulk?studentIds=...
 */
export const getBulkPaymentValidity = async (req, res) => {
  try {
    const { studentIds } = req.query;
    let studentFilter = {};
    let feeFilter = {};

    if (studentIds && typeof studentIds === 'string' && studentIds.trim()) {
      const idsList = studentIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (idsList.length > 0) {
        studentFilter = { studentId: { $in: idsList } };
        feeFilter = { studentDisplayId: { $in: idsList } };
      }
    }

    // Parallel fetch of students and fees (2 queries total)
    const [students, fees] = await Promise.all([
      Student.find(studentFilter)
        .select('studentId name feeAmount joiningDate admissionDate')
        .lean(),
      Fee.find(feeFilter)
        .sort({ paymentDate: 1, createdAt: 1 })
        .lean()
    ]);

    // Group fees by studentDisplayId
    const feesByStudent = new Map();
    for (const fee of fees) {
      const sId = fee.studentDisplayId;
      if (!sId) continue;
      if (!feesByStudent.has(sId)) {
        feesByStudent.set(sId, []);
      }
      feesByStudent.get(sId).push(fee);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validity = {};
    for (const student of students) {
      if (!student.studentId) continue;
      const studentFeeRecords = feesByStudent.get(student.studentId) || [];
      validity[student.studentId] = computeStudentValidity(student, studentFeeRecords, today);
    }

    // Also include any students with fees whose student doc might have different ID or wasn't fetched
    for (const [sId, studentFeeRecords] of feesByStudent.entries()) {
      if (!validity[sId]) {
        validity[sId] = computeStudentValidity(null, studentFeeRecords, today);
      }
    }

    res.status(200).json({
      success: true,
      count: Object.keys(validity).length,
      validity
    });
  } catch (error) {
    console.error('Error fetching bulk payment validity:', error);
    res.status(500).json({ message: 'Error fetching bulk payment validity', error: error.message });
  }
};
