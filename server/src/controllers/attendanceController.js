import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

// Format Date as YYYY-MM-DD in local time
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format current time as hh:mm AM/PM
const getCurrentTimeString = (dateObj = new Date()) => {
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Calculate time difference in minutes from two time strings (e.g., "08:30 AM", "02:45 PM")
const calculateMinutesBetweenTimes = (inTimeStr, outTimeStr, dateStr) => {
  try {
    if (!inTimeStr || !outTimeStr) return 0;
    const baseDate = dateStr || getTodayDateString();
    const inDate = new Date(`${baseDate} ${inTimeStr}`);
    const outDate = new Date(`${baseDate} ${outTimeStr}`);
    
    // If outDate is before inDate (e.g. night shift past midnight), add 1 day
    if (outDate < inDate) {
      outDate.setDate(outDate.getDate() + 1);
    }
    
    const diffMs = outDate.getTime() - inDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return 0;
  }
};

const formatMinutesToHoursMinutes = (mins) => {
  if (!mins || mins <= 0) return '0m';
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Get Attendance for a specific date (with optional shift, status, and search filters)
export const getAttendance = async (req, res) => {
  try {
    const organizationId = req.user.organizationId || 'default-org';
    const branchId = req.user.branchId || 'default-branch';
    const targetDate = req.query.date || getTodayDateString();
    const { shift, status, search, registrationType } = req.query;

    // 1. Fetch all active students for this branch
    const studentQuery = {
      organizationId,
      branchId,
      status: 'active',
    };
    if (registrationType && registrationType !== 'all') {
      studentQuery.registrationType = registrationType;
    }
    const activeStudents = await Student.find(studentQuery).sort({ name: 1 });

    // 2. Fetch existing attendance records for targetDate
    const existingRecords = await Attendance.find({
      organizationId,
      branchId,
      date: targetDate,
    });

    const recordMap = new Map();
    existingRecords.forEach((rec) => {
      recordMap.set(String(rec.studentId), rec);
      if (rec.studentRef) {
        recordMap.set(String(rec.studentRef), rec);
      }
    });

    // 3. Merge: Every active student gets an attendance entry
    let fullList = activeStudents.map((stu) => {
      const stuIdStr = String(stu._id);
      const existing = recordMap.get(stuIdStr) || recordMap.get(stu.studentId);

      if (existing) {
        // Calculate live running time if checked in but not checked out today
        let liveSpentMinutes = existing.timeSpentMinutes || 0;
        let liveSpentFormatted = existing.timeSpentFormatted || '0m';

        if (existing.inTime && (!existing.outTime || existing.status === 'present') && targetDate === getTodayDateString()) {
          const nowStr = getCurrentTimeString();
          const currentMins = calculateMinutesBetweenTimes(existing.inTime, nowStr, targetDate);
          if (currentMins > 0) {
            liveSpentMinutes = currentMins;
            liveSpentFormatted = `${formatMinutesToHoursMinutes(currentMins)} (Live)`;
          }
        }

        return {
          _id: existing._id,
          studentId: stu.studentId,
          studentRef: stu._id,
          studentName: stu.name,
          fatherName: stu.fatherName,
          mobile: stu.mobile,
          photo: stu.photo || '',
          seatNumber: stu.seatNumber || existing.seatNumber || '--',
          timeShift: stu.timeShift || existing.timeShift || '8hours',
          registrationType: stu.registrationType || existing.registrationType || 'library',
          date: targetDate,
          inTime: existing.inTime || '',
          outTime: existing.outTime || '',
          timeSpentMinutes: liveSpentMinutes,
          timeSpentFormatted: liveSpentFormatted,
          status: existing.status || 'present',
          method: existing.method || 'manual',
          remarks: existing.remarks || '',
          hasRecord: true,
        };
      }

      // Absent default for students without records on targetDate
      return {
        _id: null,
        studentId: stu.studentId,
        studentRef: stu._id,
        studentName: stu.name,
        fatherName: stu.fatherName,
        mobile: stu.mobile,
        photo: stu.photo || '',
        seatNumber: stu.seatNumber || '--',
        timeShift: stu.timeShift || '8hours',
        registrationType: stu.registrationType || 'library',
        date: targetDate,
        inTime: '',
        outTime: '',
        timeSpentMinutes: 0,
        timeSpentFormatted: '0m',
        status: 'absent',
        method: 'manual',
        remarks: '',
        hasRecord: false,
      };
    });

    // 4. Calculate Summary Stats
    const totalEnrolled = fullList.length;
    const presentList = fullList.filter((r) => r.status === 'present' || r.status === 'late');
    const currentlyInsideCount = fullList.filter((r) => r.inTime && !r.outTime).length;
    const completedCount = fullList.filter((r) => r.status === 'completed' || (r.inTime && r.outTime)).length;
    const absentCount = fullList.filter((r) => r.status === 'absent').length;

    const totalMinutesSpent = fullList.reduce((acc, curr) => acc + (curr.timeSpentMinutes || 0), 0);
    const avgMinutesSpent = (presentList.length + completedCount) > 0
      ? Math.round(totalMinutesSpent / ((presentList.length + completedCount) || 1))
      : 0;

    // 5. Apply filters
    if (shift && shift !== 'all') {
      fullList = fullList.filter((r) => (r.timeShift || '').toLowerCase().includes(shift.toLowerCase()));
    }
    if (status && status !== 'all') {
      if (status === 'inside') {
        fullList = fullList.filter((r) => r.inTime && !r.outTime);
      } else {
        fullList = fullList.filter((r) => r.status === status);
      }
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      fullList = fullList.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          (r.seatNumber && r.seatNumber.toLowerCase().includes(q)) ||
          (r.mobile && r.mobile.includes(q))
      );
    }

    return res.json({
      date: targetDate,
      summary: {
        totalEnrolled,
        presentCount: presentList.length,
        currentlyInsideCount,
        completedCount,
        absentCount,
        totalMinutesSpent,
        totalHoursFormatted: formatMinutesToHoursMinutes(totalMinutesSpent),
        avgHoursFormatted: formatMinutesToHoursMinutes(avgMinutesSpent),
      },
      records: fullList,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
  }
};

// Mark Check-In (Quick or manual)
export const markCheckIn = async (req, res) => {
  try {
    const organizationId = req.user.organizationId || 'default-org';
    const branchId = req.user.branchId || 'default-branch';
    const { studentId, date, inTime, seatNumber, method, remarks } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const targetDate = date || getTodayDateString();
    const targetInTime = inTime || getCurrentTimeString();

    // Look up student details
    const student = await Student.findOne({
      $or: [{ _id: studentId }, { studentId: studentId }],
      organizationId,
      branchId,
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Upsert attendance record
    const filter = {
      organizationId,
      branchId,
      studentId: student.studentId,
      date: targetDate,
    };

    const update = {
      studentRef: student._id,
      studentName: student.name,
      studentDisplayId: student.studentId,
      seatNumber: seatNumber || student.seatNumber || '--',
      timeShift: student.timeShift || '8hours',
      registrationType: student.registrationType || 'library',
      inTime: targetInTime,
      inTimestamp: new Date(),
      status: 'present',
      method: method || 'manual',
      remarks: remarks || '',
    };

    const record = await Attendance.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });

    return res.json({ message: 'Check-in marked successfully', record });
  } catch (error) {
    console.error('Error marking check-in:', error);
    return res.status(500).json({ message: 'Failed to mark check-in', error: error.message });
  }
};

// Mark Check-Out
export const markCheckOut = async (req, res) => {
  try {
    const organizationId = req.user.organizationId || 'default-org';
    const branchId = req.user.branchId || 'default-branch';
    const { id, studentId, date, outTime, remarks } = req.body;

    let query = {};
    if (id) {
      query._id = id;
    } else if (studentId) {
      query.studentId = studentId;
      query.date = date || getTodayDateString();
      query.organizationId = organizationId;
      query.branchId = branchId;
    } else {
      return res.status(400).json({ message: 'Record id or studentId is required' });
    }

    const record = await Attendance.findOne(query);
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found to check out' });
    }

    const targetOutTime = outTime || getCurrentTimeString();
    const inTimeStr = record.inTime || '08:00 AM';
    const timeSpentMinutes = calculateMinutesBetweenTimes(inTimeStr, targetOutTime, record.date);
    const timeSpentFormatted = formatMinutesToHoursMinutes(timeSpentMinutes);

    record.outTime = targetOutTime;
    record.outTimestamp = new Date();
    record.timeSpentMinutes = timeSpentMinutes;
    record.timeSpentFormatted = timeSpentFormatted;
    record.status = 'completed';
    if (remarks) record.remarks = remarks;

    await record.save();

    return res.json({ message: 'Check-out marked successfully', record });
  } catch (error) {
    console.error('Error marking check-out:', error);
    return res.status(500).json({ message: 'Failed to mark check-out', error: error.message });
  }
};

// Save or Update Full Manual Attendance Record
export const saveManualAttendance = async (req, res) => {
  try {
    const organizationId = req.user.organizationId || 'default-org';
    const branchId = req.user.branchId || 'default-branch';
    const {
      id,
      studentId,
      date,
      inTime,
      outTime,
      status,
      seatNumber,
      remarks,
    } = req.body;

    const targetDate = date || getTodayDateString();

    const student = await Student.findOne({
      $or: [{ _id: studentId }, { studentId: studentId }],
      organizationId,
      branchId,
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let timeSpentMinutes = 0;
    if (inTime && outTime) {
      timeSpentMinutes = calculateMinutesBetweenTimes(inTime, outTime, targetDate);
    }
    const timeSpentFormatted = formatMinutesToHoursMinutes(timeSpentMinutes);

    let record;
    if (id) {
      record = await Attendance.findById(id);
    }

    if (!record) {
      record = await Attendance.findOne({
        organizationId,
        branchId,
        studentId: student.studentId,
        date: targetDate,
      });
    }

    if (!record) {
      record = new Attendance({
        organizationId,
        branchId,
        studentId: student.studentId,
        studentRef: student._id,
        studentName: student.name,
        date: targetDate,
      });
    }

    record.studentName = student.name;
    record.studentDisplayId = student.studentId;
    record.seatNumber = seatNumber || student.seatNumber || '--';
    record.timeShift = student.timeShift || '8hours';
    record.registrationType = student.registrationType || 'library';
    record.date = targetDate;
    record.inTime = inTime || '';
    record.outTime = outTime || '';
    record.status = status || (inTime && outTime ? 'completed' : inTime ? 'present' : 'absent');
    record.timeSpentMinutes = timeSpentMinutes;
    record.timeSpentFormatted = timeSpentFormatted;
    record.remarks = remarks || '';

    await record.save();

    return res.json({ message: 'Attendance updated successfully', record });
  } catch (error) {
    console.error('Error saving manual attendance:', error);
    return res.status(500).json({ message: 'Failed to save attendance', error: error.message });
  }
};

// Delete Attendance Record
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await Attendance.findByIdAndDelete(id);
    return res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return res.status(500).json({ message: 'Failed to delete attendance', error: error.message });
  }
};
