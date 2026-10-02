import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import { getSeatStats } from '../utils/seatLayout.js';
import { getCourseLabel } from '../utils/courseOptions.js';
import { getFeeForTimeShift } from '../utils/feeRules.js';
import { computeStudentFeeDue } from '../utils/feeDues.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { registrationType } = req.query;
    const studentQuery = { status: 'active' };
    if (registrationType && registrationType !== 'all') {
      studentQuery.registrationType = registrationType;
    }

    // Run all independent queries concurrently in parallel with .lean()
    const [totalStudents, seatStats, activeStudents, allFees, recentAdmissions] = await Promise.all([
      Student.countDocuments(studentQuery),
      getSeatStats(),
      Student.find(studentQuery)
        .select('name studentId course timeShift customShiftHours feeAmount joiningDate admissionDate registrationType')
        .lean(),
      Fee.find()
        .select('studentDisplayId studentId amount month paymentDate createdAt')
        .lean(),
      Student.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name studentId course joiningDate admissionDate status')
        .lean(),
    ]);

    const { totalSeats, occupiedSeats, availableSeats } = seatStats;

    // Fast mapping for registrationType filtering without heavy Mongoose .populate()
    const activeStudentIdSet = new Set(activeStudents.map(s => s.studentId));
    const filteredFees = (registrationType && registrationType !== 'all')
      ? allFees.filter(f => activeStudentIdSet.has(f.studentDisplayId))
      : allFees;

    const totalRevenue = filteredFees.reduce((acc, fee) => acc + (fee.amount || 0), 0);

    const currentDate = new Date();
    const currentMonthNum = currentDate.getMonth();
    const currentYearNum = currentDate.getFullYear();
    const monthlyRevenue = filteredFees.reduce((acc, fee) => {
      const pDate = new Date(fee.paymentDate || fee.createdAt);
      if (pDate.getMonth() === currentMonthNum && pDate.getFullYear() === currentYearNum) {
        return acc + (fee.amount || 0);
      }
      return acc;
    }, 0);

    const paymentsByStudent = filteredFees.reduce((acc, fee) => {
      const key = fee.studentDisplayId;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        month: fee.month,
        amount: fee.amount,
        paymentDate: fee.paymentDate,
      });
      return acc;
    }, {});

    const pendingFees = activeStudents
      .map((student) => {
        const monthlyFee = Number(student.feeAmount) || getFeeForTimeShift(student.timeShift) || 0;
        const joiningDate = student.joiningDate || student.admissionDate;
        const studentPayments = paymentsByStudent[student.studentId] || [];
        const due = computeStudentFeeDue({
          monthlyFee,
          joiningDate,
          payments: studentPayments,
          asOf: currentDate,
        });

        return {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          course: getCourseLabel(student.course),
          timeShift: student.timeShift,
          customShiftHours: student.customShiftHours,
          monthlyFee,
          paidAmount: due.currentMonthPaid,
          pendingAmount: due.pendingAmount,
          overdueMonths: due.overdueMonths,
        };
      })
      .filter((student) => student.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);

    const pendingFeeTotal = pendingFees.reduce((acc, student) => acc + student.pendingAmount, 0);

    res.status(200).json({
      totalStudents,
      totalSeats,
      occupiedSeats,
      availableSeats,
      totalRevenue,
      monthlyRevenue,
      pendingFeeTotal,
      pendingFeeCount: pendingFees.length,
      pendingFees: pendingFees.slice(0, 6),
      recentAdmissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};
