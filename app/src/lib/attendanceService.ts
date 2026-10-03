import { attendanceApi, studentApi } from './apiService';
import { getStudentDisplayId } from './studentId';

export interface AttendanceSession {
  inTime: string; // e.g. "08:15 AM"
  inTimestamp?: string;
  outTime?: string; // e.g. "10:30 AM" or empty if currently inside
  outTimestamp?: string;
  durationMinutes: number; // In-library duration of this stretch
  method?: 'manual' | 'qr' | 'biometric';
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentRef?: string;
  studentName: string;
  fatherName?: string;
  mobile?: string;
  photo?: string;
  seatNumber: string;
  timeShift: string;
  registrationType: string;
  date: string; // YYYY-MM-DD
  inTime: string; // e.g. "08:15 AM" (Earliest In)
  inTimestamp?: string;
  outTime: string; // e.g. "02:30 PM" (Latest Out)
  outTimestamp?: string;
  timeSpentMinutes: number;
  timeSpentFormatted: string; // e.g. "6h 15m" or "3h 40m (Live)"
  sessions?: AttendanceSession[]; // Multiple in/out intervals (Break tracking)
  status: 'present' | 'completed' | 'absent' | 'late' | 'half_day';
  method?: 'manual' | 'qr' | 'biometric';
  remarks?: string;
  hasRecord?: boolean;
}

export interface AttendanceSummary {
  totalEnrolled: number;
  presentCount: number;
  currentlyInsideCount: number;
  completedCount: number;
  absentCount: number;
  totalMinutesSpent: number;
  totalHoursFormatted: string;
  avgHoursFormatted: string;
}

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeString = (d: Date = new Date()): string => {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const calculateMinutes = (inTime: string, outTime: string, dateStr: string): number => {
  try {
    if (!inTime || !outTime) return 0;
    const baseDate = dateStr || getTodayDateString();
    const inDate = new Date(`${baseDate} ${inTime}`);
    const outDate = new Date(`${baseDate} ${outTime}`);
    if (outDate < inDate) {
      outDate.setDate(outDate.getDate() + 1);
    }
    const diffMs = outDate.getTime() - inDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  } catch {
    return 0;
  }
};

export const formatMinutesToDisplay = (mins: number): string => {
  if (!mins || mins <= 0) return '0m';
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Local storage key helper
const getLocalKey = (date: string) => `galaxy_attendance_${date}`;

export const attendanceService = {
  getAttendance: async (date: string = getTodayDateString()): Promise<{
    date: string;
    records: AttendanceRecord[];
    summary: AttendanceSummary;
  }> => {
    // 1. Try fetching from remote API
    try {
      const data = await attendanceApi.getAttendance({ date });
      if (data && Array.isArray(data.records) && data.records.length > 0) {
        // Cache to localStorage
        try {
          localStorage.setItem(getLocalKey(date), JSON.stringify(data.records));
        } catch {}
        return data;
      }
    } catch (apiErr) {
      console.warn('Attendance API unavailable, falling back to local store:', apiErr);
    }

    // 2. Fallback / Client-side generation using active students
    let cachedRecords: AttendanceRecord[] = [];
    try {
      const saved = localStorage.getItem(getLocalKey(date));
      if (saved) {
        cachedRecords = JSON.parse(saved);
      }
    } catch {}

    const cachedMap = new Map<string, AttendanceRecord>();
    cachedRecords.forEach((r) => {
      cachedMap.set(r.studentId, r);
    });

    // Get active students
    let students: any[] = [];
    try {
      students = (await studentApi.getStudents()) || [];
    } catch {
      students = studentApi.getCachedStudents() || [];
    }

    const activeStudents = students.filter((s: any) => s.status === 'active' || !s.status);

    const mergedRecords: AttendanceRecord[] = activeStudents.map((stu: any) => {
      const stuDisplayId = getStudentDisplayId(stu) || stu.studentId || stu._id;
      const existing = cachedMap.get(stuDisplayId) || cachedMap.get(stu._id);

      if (existing) {
        // Multi-session time calculation
        let spentMins = existing.timeSpentMinutes || 0;
        let formattedSpent = existing.timeSpentFormatted || '0m';
        const sessions = existing.sessions || [];

        if (sessions.length > 0) {
          const completedMins = sessions
            .filter((s) => s.outTime)
            .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

          const openSession = sessions[sessions.length - 1];
          if (openSession && !openSession.outTime && date === getTodayDateString()) {
            const nowStr = getCurrentTimeString();
            const liveCurrentMins = calculateMinutes(openSession.inTime, nowStr, date);
            spentMins = completedMins + liveCurrentMins;
            formattedSpent = `${formatMinutesToDisplay(spentMins)} (Live)`;
          } else {
            spentMins = completedMins;
            formattedSpent = formatMinutesToDisplay(spentMins);
          }
        } else if (existing.inTime && (!existing.outTime || existing.status === 'present') && date === getTodayDateString()) {
          const nowStr = getCurrentTimeString();
          const currentMins = calculateMinutes(existing.inTime, nowStr, date);
          if (currentMins > 0) {
            spentMins = currentMins;
            formattedSpent = `${formatMinutesToDisplay(currentMins)} (Live)`;
          }
        }

        return {
          ...existing,
          sessions,
          photo: stu.photo || existing.photo || '',
          seatNumber: stu.seatNumber || existing.seatNumber || '--',
          timeShift: stu.timeShift || existing.timeShift || '8hours',
          timeSpentMinutes: spentMins,
          timeSpentFormatted: formattedSpent,
        };
      }

      // Default absent record for date
      return {
        id: `local_${stuDisplayId}_${date}`,
        studentId: stuDisplayId,
        studentRef: stu._id,
        studentName: stu.name,
        fatherName: stu.fatherName || stu.father || '',
        mobile: stu.mobile,
        photo: stu.photo || '',
        seatNumber: stu.seatNumber || '--',
        timeShift: stu.timeShift || '8hours',
        registrationType: stu.registrationType || 'library',
        date,
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

    // Calculate Summary
    const totalEnrolled = mergedRecords.length;
    const presentList = mergedRecords.filter((r) => r.status === 'present' || r.status === 'late');
    const currentlyInsideCount = mergedRecords.filter((r) => r.inTime && !r.outTime).length;
    const completedCount = mergedRecords.filter((r) => r.status === 'completed' || (r.inTime && r.outTime)).length;
    const absentCount = mergedRecords.filter((r) => r.status === 'absent').length;

    const totalMinutesSpent = mergedRecords.reduce((acc, curr) => acc + (curr.timeSpentMinutes || 0), 0);
    const avgMinutesSpent =
      presentList.length + completedCount > 0
        ? Math.round(totalMinutesSpent / (presentList.length + completedCount))
        : 0;

    return {
      date,
      summary: {
        totalEnrolled,
        presentCount: presentList.length,
        currentlyInsideCount,
        completedCount,
        absentCount,
        totalMinutesSpent,
        totalHoursFormatted: formatMinutesToDisplay(totalMinutesSpent),
        avgHoursFormatted: formatMinutesToDisplay(avgMinutesSpent),
      },
      records: mergedRecords,
    };
  },

  markCheckIn: async (data: {
    studentId: string;
    date?: string;
    inTime?: string;
    seatNumber?: string;
    remarks?: string;
  }) => {
    const targetDate = data.date || getTodayDateString();
    const inTime = data.inTime || getCurrentTimeString();

    try {
      await attendanceApi.markCheckIn({
        ...data,
        date: targetDate,
        inTime,
      });
    } catch (e) {
      console.warn('Remote check-in failed, saving locally:', e);
    }

    // Save locally
    try {
      const saved = localStorage.getItem(getLocalKey(targetDate));
      const list: AttendanceRecord[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((r) => r.studentId === data.studentId);

      if (idx >= 0) {
        const item = list[idx];
        const existingSessions = item.sessions || [];
        const lastSession = existingSessions[existingSessions.length - 1];

        const newSessions = [...existingSessions];
        if (!lastSession || lastSession.outTime) {
          // Re-entry: student starts a new inside session (e.g. after lunch/tea break)
          newSessions.push({
            inTime,
            inTimestamp: new Date().toISOString(),
            outTime: '',
            durationMinutes: 0,
            method: 'biometric',
          });
        }

        list[idx] = {
          ...item,
          inTime: item.inTime || inTime,
          outTime: '',
          status: 'present',
          sessions: newSessions,
          hasRecord: true,
        };
      } else {
        const updated: AttendanceRecord = {
          id: `att_${data.studentId}_${targetDate}`,
          studentId: data.studentId,
          studentName: '',
          seatNumber: data.seatNumber || '--',
          timeShift: '8hours',
          registrationType: 'library',
          date: targetDate,
          inTime,
          outTime: '',
          timeSpentMinutes: 0,
          timeSpentFormatted: '0m (In Progress)',
          sessions: [
            {
              inTime,
              inTimestamp: new Date().toISOString(),
              outTime: '',
              durationMinutes: 0,
              method: 'biometric',
            },
          ],
          status: 'present',
          method: 'biometric',
          remarks: data.remarks || '',
          hasRecord: true,
        };
        list.push(updated);
      }
      localStorage.setItem(getLocalKey(targetDate), JSON.stringify(list));
    } catch {}

    return true;
  },

  markCheckOut: async (data: {
    id?: string;
    studentId: string;
    date?: string;
    outTime?: string;
    inTime?: string;
    remarks?: string;
  }) => {
    const targetDate = data.date || getTodayDateString();
    const outTime = data.outTime || getCurrentTimeString();

    try {
      await attendanceApi.markCheckOut({
        ...data,
        date: targetDate,
        outTime,
      });
    } catch (e) {
      console.warn('Remote check-out failed, saving locally:', e);
    }

    // Save locally
    try {
      const saved = localStorage.getItem(getLocalKey(targetDate));
      const list: AttendanceRecord[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((r) => r.studentId === data.studentId);

      if (idx >= 0) {
        const item = list[idx];
        const existingSessions = item.sessions || [];
        const newSessions = [...existingSessions];

        if (newSessions.length === 0) {
          const inTimeStr = data.inTime || item.inTime || '08:00 AM';
          const mins = calculateMinutes(inTimeStr, outTime, targetDate);
          newSessions.push({
            inTime: inTimeStr,
            outTime,
            outTimestamp: new Date().toISOString(),
            durationMinutes: mins,
          });
        } else {
          const lastIdx = newSessions.length - 1;
          const lastSession = newSessions[lastIdx];
          const mins = calculateMinutes(lastSession.inTime, outTime, targetDate);
          newSessions[lastIdx] = {
            ...lastSession,
            outTime,
            outTimestamp: new Date().toISOString(),
            durationMinutes: mins,
          };
        }

        const totalMins = newSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

        list[idx] = {
          ...item,
          outTime,
          timeSpentMinutes: totalMins,
          timeSpentFormatted: formatMinutesToDisplay(totalMins),
          sessions: newSessions,
          status: 'completed',
          remarks: data.remarks || item.remarks || '',
          hasRecord: true,
        };
        localStorage.setItem(getLocalKey(targetDate), JSON.stringify(list));
      }
    } catch {}

    return true;
  },

  saveManualRecord: async (record: Partial<AttendanceRecord> & { studentId: string; date: string }) => {
    try {
      await attendanceApi.saveManual(record);
    } catch (e) {
      console.warn('Remote save manual failed, saving locally:', e);
    }

    // Save locally
    try {
      const saved = localStorage.getItem(getLocalKey(record.date));
      const list: AttendanceRecord[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((r) => r.studentId === record.studentId);

      let mins = 0;
      if (record.inTime && record.outTime) {
        mins = calculateMinutes(record.inTime, record.outTime, record.date);
      }

      const formatted = formatMinutesToDisplay(mins);

      const entry: AttendanceRecord = {
        id: record.id || `att_${record.studentId}_${record.date}`,
        studentId: record.studentId,
        studentName: record.studentName || '',
        seatNumber: record.seatNumber || '--',
        timeShift: record.timeShift || '8hours',
        registrationType: record.registrationType || 'library',
        date: record.date,
        inTime: record.inTime || '',
        outTime: record.outTime || '',
        timeSpentMinutes: mins,
        timeSpentFormatted: formatted,
        status: record.status || (record.inTime && record.outTime ? 'completed' : record.inTime ? 'present' : 'absent'),
        method: record.method || 'manual',
        remarks: record.remarks || '',
        hasRecord: true,
      };

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entry };
      } else {
        list.push(entry);
      }
      localStorage.setItem(getLocalKey(record.date), JSON.stringify(list));
    } catch {}

    return true;
  },

  deleteRecord: async (studentId: string, date: string, recordId?: string) => {
    if (recordId && !recordId.startsWith('local_') && !recordId.startsWith('att_')) {
      try {
        await attendanceApi.deleteRecord(recordId);
      } catch {}
    }

    try {
      const saved = localStorage.getItem(getLocalKey(date));
      if (saved) {
        let list: AttendanceRecord[] = JSON.parse(saved);
        list = list.filter((r) => r.studentId !== studentId);
        localStorage.setItem(getLocalKey(date), JSON.stringify(list));
      }
    } catch {}

    return true;
  },

  syncBiometricPunch: async (payload: {
    fingerId?: number | string;
    studentId?: string;
    mac?: string;
    timestamp?: string;
    date?: string;
  }) => {
    try {
      return await attendanceApi.sendBiometricPunch(payload);
    } catch (e: any) {
      console.warn('Biometric punch API failed, recording fallback:', e);
      if (payload.studentId) {
        const today = payload.date || getTodayDateString();
        const saved = localStorage.getItem(getLocalKey(today));
        const list: AttendanceRecord[] = saved ? JSON.parse(saved) : [];
        const idx = list.findIndex((r) => r.studentId === payload.studentId);
        if (idx >= 0 && list[idx].inTime && !list[idx].outTime) {
          await attendanceService.markCheckOut({ studentId: payload.studentId, date: today });
          return { success: true, action: 'out', message: 'Check-out marked (Offline fallback)' };
        } else {
          await attendanceService.markCheckIn({ studentId: payload.studentId, date: today });
          return { success: true, action: 'in', message: 'Check-in marked (Offline fallback)' };
        }
      }
      throw e;
    }
  },
};
