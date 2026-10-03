import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Download,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Users,
  Armchair,
  Sparkles,
  X,
  Fingerprint,
  Radio,
  Terminal,
  History,
  Coffee,
  ArrowRight,
  Wifi,
  Network,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import {
  attendanceService,
  getTodayDateString,
  getCurrentTimeString,
  calculateMinutes,
  formatMinutesToDisplay,
  type AttendanceRecord,
  type AttendanceSummary,
} from '../lib/attendanceService';
import { biometricBleService, type FingerMapping } from '../lib/biometricBleService';
import { studentApi } from '../lib/apiService';
import { getStudentDisplayId } from '../lib/studentId';
import { getTimeShiftLabel, TIME_SHIFT_OPTIONS } from '../lib/feeRules';
import { getInitials, getAvatarColor } from '../sections/students/students';

const STATUS_CONFIG = {
  present: {
    label: 'Currently Inside',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500 animate-pulse',
    icon: LogIn,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: CheckCircle2,
  },
  late: {
    label: 'Late Arrival',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  half_day: {
    label: 'Half Day',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    icon: Clock,
  },
  absent: {
    label: 'Absent',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
    icon: XCircle,
  },
};

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalEnrolled: 0,
    presentCount: 0,
    currentlyInsideCount: 0,
    completedCount: 0,
    absentCount: 0,
    totalMinutesSpent: 0,
    totalHoursFormatted: '0m',
    avgHoursFormatted: '0m',
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<AttendanceRecord> | null>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedSessionRecord, setSelectedSessionRecord] = useState<AttendanceRecord | null>(null);

  // Biometric Device State
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricModalTab, setBiometricModalTab] = useState<'wifi' | 'ble'>('wifi');
  const [scannerIp, setScannerIp] = useState<string>(() => localStorage.getItem('galaxy_scanner_ip') || '');
  const [scannerWifiMac] = useState<string>('94:54:C5:65:05:D1');
  const [scannerBleMac] = useState<string>('94:54:C5:65:05:D2');
  const [scannerDeviceName] = useState<string>('Petpooja_Payroll_72');
  const [isProbingScanner, setIsProbingScanner] = useState(false);
  const [probeResult, setProbeResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isPunchSyncing, setIsPunchSyncing] = useState(false);

  const [isBiometricConnected, setIsBiometricConnected] = useState(() =>
    biometricBleService.getConnectedStatus()
  );
  const [biometricDeviceName, setBiometricDeviceName] = useState(() =>
    biometricBleService.getDeviceName()
  );
  const [biometricLogs, setBiometricLogs] = useState<string[]>([]);
  const [fingerMappings, setFingerMappings] = useState<FingerMapping[]>(() =>
    biometricBleService.getFingerMappings()
  );
  const [newFingerId, setNewFingerId] = useState<number>(1);
  const [newMappedStudentId, setNewMappedStudentId] = useState<string>('');
  const [isConnectingBle, setIsConnectingBle] = useState(false);
  const [lastDetectedFinger, setLastDetectedFinger] = useState<{
    fingerId: number;
    studentName?: string;
    seatNumber?: string;
    isMapped: boolean;
    timestamp: string;
  } | null>(null);

  // Ensure light mode on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Biometric BLE event subscriptions
  useEffect(() => {
    const unsubLog = biometricBleService.onLog((log) => {
      setBiometricLogs((prev) => [...prev.slice(-30), log]);
    });

    const unsubStatus = biometricBleService.onStatus((connected, name) => {
      setIsBiometricConnected(connected);
      if (name) setBiometricDeviceName(name);
      if (connected) {
        notify(`🟢 Biometric Scanner "${name}" Connected!`);
      } else {
        notify('Biometric Scanner Disconnected');
      }
    });

    const unsubPunch = biometricBleService.onPunch(async (event) => {
      const fId = event.fingerId;
      if (fId !== undefined) {
        const mappings = biometricBleService.getFingerMappings();
        const mapping = mappings.find((m) => m.fingerId === fId);
        setLastDetectedFinger({
          fingerId: fId,
          studentName: mapping?.studentName,
          seatNumber: mapping?.seatNumber,
          isMapped: !!mapping,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
        });
        if (!mapping) {
          setNewFingerId(fId);
          notify(`👆 Unmapped Finger detected: Slot #${fId}! Select student below to assign.`);
        } else {
          notify(`👆 Fingerprint Punch: ${mapping.studentName} (Slot #${fId})`);
        }
      } else {
        notify(`👆 Fingerprint Punch Detected`);
      }

      if (event.studentId) {
        const existing = records.find((r) => r.studentId === event.studentId);
        if (existing && existing.inTime && !existing.outTime) {
          // Already inside -> Mark Check Out
          await handleQuickCheckOut(existing);
        } else if (existing) {
          // Absent / Not inside -> Mark Check In
          await handleQuickCheckIn(existing);
        } else {
          // Direct check in
          await attendanceService.markCheckIn({
            studentId: event.studentId,
            date: getTodayDateString(),
            inTime: getCurrentTimeString(),
          });
          loadAttendance();
        }
      }
    });

    return () => {
      unsubLog();
      unsubStatus();
      unsubPunch();
    };
  }, [records]);

  const handleConnectBiometric = async () => {
    setIsConnectingBle(true);
    try {
      await biometricBleService.connect();
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        alert(err.message || 'Bluetooth connection failed');
      }
    } finally {
      setIsConnectingBle(false);
    }
  };

  const handleDisconnectBiometric = async () => {
    await biometricBleService.disconnect();
  };

  const handleSaveMapping = () => {
    if (!newMappedStudentId) {
      notify('⚠️ Please select a student first');
      return;
    }
    const student = allStudents.find(
      (s) => getStudentDisplayId(s) === newMappedStudentId || s.studentId === newMappedStudentId
    );
    if (!student) return;

    const list = biometricBleService.saveFingerMapping({
      fingerId: Number(newFingerId),
      studentId: getStudentDisplayId(student) || student.studentId,
      studentName: student.name,
      seatNumber: student.seatNumber || '--',
    });
    setFingerMappings([...list]);
    notify(`✅ Finger Slot #${newFingerId} mapped to ${student.name}`);
    setNewFingerId((prev) => prev + 1);
  };

  const handleRemoveMapping = (fingerId: number) => {
    const list = biometricBleService.removeFingerMapping(fingerId);
    setFingerMappings([...list]);
    notify(`Mapping for Finger #${fingerId} removed`);
  };

  const getWebhookUrl = () => {
    const origin = window.location.origin;
    const baseUrl =
      origin.includes('localhost') || origin.includes('127.0.0.1')
        ? 'http://localhost:5000'
        : origin;
    return `${baseUrl}/api/v1/attendance/biometric/punch`;
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(getWebhookUrl());
    setCopiedWebhook(true);
    notify('📋 Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleProbeScanner = async () => {
    setIsProbingScanner(true);
    setProbeResult(null);
    try {
      if (scannerIp) {
        localStorage.setItem('galaxy_scanner_ip', scannerIp);
      }
      const res = await attendanceService.syncBiometricPunch({
        mac: scannerWifiMac,
        fingerId: 9999,
      });
      if (res) {
        setProbeResult({
          ok: true,
          message: `Scanner endpoint & WiFi route active! Device MAC: ${scannerWifiMac}`,
        });
        notify('✅ Attendance Biometric endpoint is active & receiving punches!');
      }
    } catch (e: any) {
      setProbeResult({
        ok: false,
        message: e?.message || 'Could not verify endpoint connection',
      });
    } finally {
      setIsProbingScanner(false);
    }
  };

  const handleWifiPunch = async (slotNumber: number, studentId?: string) => {
    setIsPunchSyncing(true);
    try {
      const mapping = fingerMappings.find((m) => m.fingerId === slotNumber);
      const targetStudentId = studentId || mapping?.studentId;

      if (!targetStudentId) {
        notify(`⚠️ Slot #${slotNumber} is not assigned to any student yet!`);
        return;
      }

      setLastDetectedFinger({
        fingerId: slotNumber,
        studentName: mapping?.studentName || targetStudentId,
        seatNumber: mapping?.seatNumber || '--',
        isMapped: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: true }),
      });

      const res = await attendanceService.syncBiometricPunch({
        fingerId: slotNumber,
        studentId: targetStudentId,
        mac: scannerWifiMac,
        date: selectedDate,
      });

      const sName = res?.studentName || mapping?.studentName || targetStudentId;
      const act = res?.action === 'out' ? 'Checked-Out' : 'Checked-In';
      notify(`⚡ WiFi Punch: ${sName} (${act})`);
      await loadAttendance();
    } catch (err: any) {
      console.error('Error during WiFi punch:', err);
      notify('⚠️ Punch sync failed: ' + (err?.message || 'Error'));
    } finally {
      setIsPunchSyncing(false);
    }
  };

  // Fetch Attendance for Selected Date
  const loadAttendance = async (dateStr = selectedDate) => {
    setLoading(true);
    try {
      const data = await attendanceService.getAttendance(dateStr);
      setRecords(data.records || []);
      setSummary(
        data.summary || {
          totalEnrolled: 0,
          presentCount: 0,
          currentlyInsideCount: 0,
          completedCount: 0,
          absentCount: 0,
          totalMinutesSpent: 0,
          totalHoursFormatted: '0m',
          avgHoursFormatted: '0m',
        }
      );
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate]);

  // Load student list for manual entry picker
  useEffect(() => {
    studentApi
      .getStudents()
      .then((res) => {
        if (Array.isArray(res)) setAllStudents(res);
      })
      .catch(() => {
        const cached = studentApi.getCachedStudents();
        if (cached) setAllStudents(cached);
      });
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Quick Date Navigation
  const changeDateByDays = (delta: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + delta);
    const yr = curr.getFullYear();
    const mo = String(curr.getMonth() + 1).padStart(2, '0');
    const da = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  const isToday = selectedDate === getTodayDateString();

  // 1-Click Check In
  const handleQuickCheckIn = async (record: AttendanceRecord) => {
    const inTime = getCurrentTimeString();
    await attendanceService.markCheckIn({
      studentId: record.studentId,
      date: selectedDate,
      inTime,
      seatNumber: record.seatNumber,
    });
    notify(`✅ Checked in: ${record.studentName} at ${inTime}`);
    loadAttendance();
  };

  // 1-Click Check Out
  const handleQuickCheckOut = async (record: AttendanceRecord) => {
    const outTime = getCurrentTimeString();
    await attendanceService.markCheckOut({
      id: record.id,
      studentId: record.studentId,
      date: selectedDate,
      inTime: record.inTime,
      outTime,
    });
    notify(`👋 Checked out: ${record.studentName} at ${outTime}`);
    loadAttendance();
  };

  // Open Edit / Manual Modal
  const handleOpenEdit = (rec?: AttendanceRecord) => {
    if (rec) {
      setEditingRecord({ ...rec });
    } else {
      setEditingRecord({
        studentId: '',
        studentName: '',
        date: selectedDate,
        inTime: getCurrentTimeString(),
        outTime: '',
        status: 'present',
        seatNumber: '--',
        remarks: '',
      });
    }
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord?.studentId) {
      notify('⚠️ Please select a student!');
      return;
    }

    await attendanceService.saveManualRecord({
      ...editingRecord,
      studentId: editingRecord.studentId,
      date: editingRecord.date || selectedDate,
      inTime: editingRecord.inTime || '',
      outTime: editingRecord.outTime || '',
      status: (editingRecord.status as any) || 'present',
    });

    notify(`✅ Attendance saved for ${editingRecord.studentName || 'student'}`);
    setIsModalOpen(false);
    setEditingRecord(null);
    loadAttendance();
  };

  // Delete Attendance Record
  const handleDelete = async (record: AttendanceRecord) => {
    if (window.confirm(`Reset attendance for ${record.studentName}?`)) {
      await attendanceService.deleteRecord(record.studentId, selectedDate, record.id);
      notify(`Attendance reset for ${record.studentName}`);
      loadAttendance();
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (rec.studentName || '').toLowerCase().includes(q);
        const matchesId = (rec.studentId || '').toLowerCase().includes(q);
        const matchesSeat = (rec.seatNumber || '').toLowerCase().includes(q);
        const matchesMobile = (rec.mobile || '').includes(q);
        if (!matchesName && !matchesId && !matchesSeat && !matchesMobile) return false;
      }

      // Shift Filter
      if (shiftFilter !== 'all') {
        if (!rec.timeShift?.toLowerCase().includes(shiftFilter.toLowerCase())) return false;
      }

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'inside') {
          if (!rec.inTime || rec.outTime) return false;
        } else if (rec.status !== statusFilter) {
          return false;
        }
      }

      // Registration Type Filter
      if (typeFilter !== 'all') {
        if (rec.registrationType !== typeFilter) return false;
      }

      return true;
    });
  }, [records, searchQuery, shiftFilter, statusFilter, typeFilter]);

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      'Student Name',
      'Student ID',
      'Seat Number',
      'Shift',
      'Date',
      'In Time',
      'Out Time',
      'Time Spent',
      'Status',
      'Remarks',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentId}"`,
      `"${r.seatNumber}"`,
      `"${getTimeShiftLabel(r.timeShift)}"`,
      `"${r.date}"`,
      `"${r.inTime || '--'}"`,
      `"${r.outTime || '--'}"`,
      `"${r.timeSpentFormatted || '0m'}"`,
      `"${r.status}"`,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Galaxy_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`📥 Attendance exported for ${selectedDate}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <TopHeader />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#1e293b] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 text-sm font-semibold"
          >
            <Sparkles size={18} className="text-yellow-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Header with Live Clock & Quick Actions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Student Attendance Register
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Real-time check-in, check-out tracking, shift logs & daily study hours
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Clock Badge */}
          <div className="px-3.5 py-2 bg-slate-100 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 border border-slate-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Clock size={14} className="text-blue-600" />
            <span>Live: {currentTime}</span>
          </div>

          {/* Biometric Scanner (WiFi & BLE) */}
          <button
            type="button"
            onClick={() => setIsBiometricModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            title="Configure Biometric Scanner (WiFi & BLE)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi size={15} className="text-emerald-600" />
            <Fingerprint size={16} />
            <span>Biometric Setup (WiFi & BLE)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Mark Check-In</span>
          </button>

          <button
            type="button"
            onClick={exportToCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => loadAttendance()}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ==================== DAYS-WISE TOP FILTER SECTION ==================== */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Days-Wise Date Filter
            </span>
          </div>

          {/* Quick Date Selectors */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => changeDateByDays(-1)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(getTodayDateString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isToday
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yr = y.getFullYear();
                const mo = String(y.getMonth() + 1).padStart(2, '0');
                const da = String(y.getDate()).padStart(2, '0');
                setSelectedDate(`${yr}-${mo}-${da}`);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Yesterday
            </button>

            {/* Custom Date Input */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => changeDateByDays(1)}
              disabled={isToday}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isToday
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Secondary Filters: Search, Shifts, Status, Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search student, ID, or seat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Study Shifts</option>
              {TIME_SHIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Attendance Status</option>
              <option value="inside">🟢 Currently Inside (Studying)</option>
              <option value="completed">🔵 Completed Shift</option>
              <option value="late">🟡 Late Arrival</option>
              <option value="absent">🔴 Absent Today</option>
            </select>
          </div>

          {/* Center Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Facilities</option>
              <option value="library">Library Students</option>
              <option value="computer_center">Computer Center</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== SUMMARY METRIC STATS CARDS ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Enrolled */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">
            {summary.totalEnrolled}
          </div>
          <p className="text-[10px] text-slate-400">Total active students</p>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-3xl p-4 border border-emerald-200/80 shadow-xs space-y-1 bg-gradient-to-b from-emerald-50/20 to-transparent">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600">
            {summary.presentCount}
          </div>
          <p className="text-[10px] text-emerald-600/70">Checked in on {selectedDate}</p>
        </div>

        {/* Currently Inside */}
        <div className="bg-white rounded-3xl p-4 border border-emerald-300 shadow-sm space-y-1 bg-gradient-to-b from-emerald-50/50 to-transparent relative overflow-hidden">
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inside</span>
            <LogIn size={16} className="mr-3" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700">
            {summary.currentlyInsideCount}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold">Active in Hall Now</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <LogOut size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            {summary.completedCount}
          </div>
          <p className="text-[10px] text-slate-400">Checked out</p>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-3xl p-4 border border-rose-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent</span>
            <XCircle size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600">
            {summary.absentCount}
          </div>
          <p className="text-[10px] text-slate-400">Not attended</p>
        </div>

        {/* Avg Time Spent */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Study</span>
            <Clock size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {summary.avgHoursFormatted || '0m'}
          </div>
          <p className="text-[10px] text-slate-400">Per present student</p>
        </div>
      </div>

      {/* ==================== ATTENDANCE TABLE LIST ==================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">
              Attendance Records for {selectedDate}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredRecords.length} Students
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                <th className="py-3.5 px-4 sm:px-6">Student's Name</th>
                <th className="py-3.5 px-4">Shift / Plan</th>
                <th className="py-3.5 px-4">In_Time</th>
                <th className="py-3.5 px-4">Out_Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Time_Spent</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No attendance records found for this date & filter.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try changing filters or click "Mark Check-In" to record attendance.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.absent;
                  const isCurrentlyInside = item.inTime && !item.outTime;

                  return (
                    <tr
                      key={item.studentId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Student's Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.studentName}
                              className="w-10 h-10 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs ${getAvatarColor(
                                item.studentName || 'S'
                              )}`}
                            >
                              {getInitials(item.studentName || 'Student')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate">
                              {item.studentName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{item.studentId}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                                <Armchair size={10} className="text-blue-500" />
                                {item.seatNumber && item.seatNumber !== '--'
                                  ? `Seat ${item.seatNumber}`
                                  : 'No Seat'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Shift / Plan */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">
                          {getTimeShiftLabel(item.timeShift)}
                        </span>
                      </td>

                      {/* In_Time */}
                      <td className="py-3.5 px-4 font-mono">
                        {item.inTime ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200/70">
                            <LogIn size={12} />
                            {item.inTime}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">--</span>
                        )}
                      </td>

                      {/* Out_Time */}
                      <td className="py-3.5 px-4 font-mono">
                        {item.outTime ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200/70">
                            <LogOut size={12} />
                            {item.outTime}
                          </span>
                        ) : isCurrentlyInside ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Inside Hall
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">--</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border whitespace-nowrap ${statusInfo.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Time_Spent */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.timeSpentFormatted && item.timeSpentFormatted !== '0m' ? (
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock size={13} className="text-blue-500" />
                              {item.timeSpentFormatted}
                            </span>
                            {item.sessions && item.sessions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setSelectedSessionRecord(item)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors shadow-2xs"
                                title="Click to view breaks & all in/out punches"
                              >
                                <History size={10} />
                                <span>{item.sessions.length} Sessions</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">0m</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If not checked in today: Show Check In button */}
                          {!item.inTime && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckIn(item)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Mark In"
                            >
                              <LogIn size={13} />
                              <span>In</span>
                            </button>
                          )}

                          {/* If checked in & still inside: Show Check Out button (Step Out / Leave) */}
                          {isCurrentlyInside && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(item)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Step Out (Break / Exit)"
                            >
                              <LogOut size={13} />
                              <span>Out</span>
                            </button>
                          )}

                          {/* If previously checked out: Show Re-In button for re-entry */}
                          {item.inTime && !isCurrentlyInside && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckIn(item)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Return from Break (Mark In Again)"
                            >
                              <LogIn size={13} />
                              <span>Re-In</span>
                            </button>
                          )}

                          {/* View Multi-session history button if sessions exist */}
                          {item.sessions && item.sessions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedSessionRecord(item)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="View In/Out & Break Timeline"
                            >
                              <History size={13} />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Reset / Delete if has custom record */}
                          {item.inTime && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs transition-colors cursor-pointer"
                              title="Reset"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MANUAL CHECK-IN & EDIT MODAL ==================== */}
      <AnimatePresence>
        {isModalOpen && editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-800">
                    {editingRecord.studentId ? 'Update Attendance' : 'Mark New Attendance'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="p-6 space-y-4">
                {/* Student Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Student *
                  </label>
                  {editingRecord.studentName && editingRecord.studentId ? (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-800">
                          {editingRecord.studentName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {editingRecord.studentId} • Seat: {editingRecord.seatNumber || '--'}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
                        Selected
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      value={editingRecord.studentId || ''}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const s = allStudents.find(
                          (stu) => getStudentDisplayId(stu) === sid || stu.studentId === sid || stu._id === sid
                        );
                        if (s) {
                          setEditingRecord((prev) => ({
                            ...prev,
                            studentId: getStudentDisplayId(s) || s.studentId,
                            studentName: s.name,
                            seatNumber: s.seatNumber || '--',
                            timeShift: s.timeShift || '8hours',
                            registrationType: s.registrationType || 'library',
                          }));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">-- Choose a student --</option>
                      {allStudents.map((s) => (
                        <option
                          key={s._id || s.studentId}
                          value={getStudentDisplayId(s) || s.studentId}
                        >
                          {s.name} ({getStudentDisplayId(s) || s.studentId}) - Seat: {s.seatNumber || '--'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingRecord.date || selectedDate}
                    onChange={(e) =>
                      setEditingRecord((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* In Time & Out Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      In Time (Entry)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 08:30 AM"
                      value={editingRecord.inTime || ''}
                      onChange={(e) =>
                        setEditingRecord((prev) => ({ ...prev, inTime: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Out Time (Exit)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 02:45 PM"
                      value={editingRecord.outTime || ''}
                      onChange={(e) =>
                        setEditingRecord((prev) => ({ ...prev, outTime: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Attendance Status
                  </label>
                  <select
                    value={editingRecord.status || 'present'}
                    onChange={(e) =>
                      setEditingRecord((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="present">🟢 Present (Currently Inside)</option>
                    <option value="completed">🔵 Completed Shift</option>
                    <option value="late">🟡 Late Arrival</option>
                    <option value="half_day">🟣 Half Day</option>
                    <option value="absent">🔴 Absent</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Remarks / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inquired about evening shift change"
                    value={editingRecord.remarks || ''}
                    onChange={(e) =>
                      setEditingRecord((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                  >
                    Save Attendance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Biometric Scanner Device Setup Modal */}
      <AnimatePresence>
        {isBiometricModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <Fingerprint size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                      Petpooja Biometric Scanner Setup
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                        WiFi Online • {scannerDeviceName}
                      </span>
                    </h2>
                    <p className="text-xs text-indigo-200/80">
                      Sync attendance punches wirelessly via WiFi / LAN or Direct Bluetooth without subscription fees
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBiometricModalOpen(false)}
                  className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs: WiFi vs Bluetooth */}
              <div className="flex border-b border-slate-200 bg-slate-100/90 px-5 pt-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBiometricModalTab('wifi')}
                  className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    biometricModalTab === 'wifi'
                      ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wifi size={15} className={biometricModalTab === 'wifi' ? 'text-indigo-600' : ''} />
                  <span>WiFi Network / LAN (Recommended)</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-semibold">
                    Online
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricModalTab('ble')}
                  className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    biometricModalTab === 'ble'
                      ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Radio size={14} className={biometricModalTab === 'ble' ? 'text-indigo-600' : ''} />
                  <span>Direct Bluetooth (BLE)</span>
                  {isBiometricConnected && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-semibold">
                      Connected
                    </span>
                  )}
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {biometricModalTab === 'wifi' ? (
                  <>
                    {/* WiFi Device Status Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center">
                            <Wifi size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-800">
                                {scannerDeviceName}
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                🟢 Online on WiFi
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Connected to Library WiFi network • Powered & Ready
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            notify('🔄 Syncing attendance records...');
                            loadAttendance();
                          }}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                          <span>Sync Attendance</span>
                        </button>
                      </div>

                      {/* MAC Addresses Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Wifi size={13} className="text-indigo-500" />
                              WiFi MAC Address (Image 2)
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              Active
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-800 block">
                            {scannerWifiMac}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            WiFi router & LAN communication MAC
                          </span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Radio size={13} className="text-blue-500" />
                              Bluetooth MAC Address (Image 1)
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                              BLE +1
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-800 block">
                            {scannerBleMac}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Mobile App Bluetooth connection MAC
                          </span>
                        </div>
                      </div>

                      {/* Explanation Banner for user */}
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                          <span>💡 MAC Address Difference Explained (D1 vs D2):</span>
                        </p>
                        <p className="text-[11px] leading-relaxed text-indigo-900/90">
                          Aapke circular biometric puck ke andar <strong>ESP32 chip</strong> lagi hai. ESP32 hardware me 2 MAC address hote hain:
                          <strong> D1</strong> WiFi ke liye hota hai aur <strong>D2</strong> Bluetooth ke liye. Dono ek hi device ke connection doors hain! Kyunki machine WiFi se already connect ho chuki hai, isliye ab PC par Bluetooth ki koi zarurat nahi hai.
                        </p>
                      </div>
                    </div>

                    {/* Webhook & Push Endpoint Configuration */}
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Network size={14} className="text-blue-600" />
                            <span>Biometric Punch Webhook / Push URL</span>
                          </h3>
                          <p className="text-xs text-slate-500">
                            Direct HTTP endpoint that records In/Out punches pushed over WiFi
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={getWebhookUrl()}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyWebhook}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                        >
                          {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedWebhook ? 'Copied!' : 'Copy URL'}</span>
                        </button>
                      </div>

                      {/* Scanner IP Probe Tool */}
                      <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Scanner Local IP Address (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 192.168.1.150 (Router DHCP IP)"
                            value={scannerIp}
                            onChange={(e) => setScannerIp(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <button
                            type="button"
                            onClick={handleProbeScanner}
                            disabled={isProbingScanner}
                            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Send size={13} className={isProbingScanner ? 'animate-spin' : ''} />
                            <span>{isProbingScanner ? 'Checking...' : 'Probe Endpoint'}</span>
                          </button>
                        </div>
                      </div>

                      {probeResult && (
                        <div
                          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                            probeResult.ok
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {probeResult.ok ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-rose-600 shrink-0" />
                          )}
                          <span>{probeResult.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Fingerprint Slot Assignment (Student Mapping) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Fingerprint Slot Assignment (Student Mapping)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Link hardware finger ID slot numbers (e.g. 1, 2, 3...) to registered students
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg">
                          {fingerMappings.length} Mapped
                        </span>
                      </div>

                      {/* Detection / Status Indicator Banner */}
                      <div
                        className={`p-3.5 rounded-2xl border transition-all ${
                          lastDetectedFinger
                            ? lastDetectedFinger.isMapped
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-800'
                        }`}
                      >
                        {lastDetectedFinger ? (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-3 h-3 rounded-full shrink-0 ${
                                  lastDetectedFinger.isMapped
                                    ? 'bg-emerald-500 animate-ping'
                                    : 'bg-amber-500 animate-pulse'
                                }`}
                              />
                              <div>
                                <div className="font-bold text-xs flex flex-wrap items-center gap-2">
                                  <span>Slot #{lastDetectedFinger.fingerId} Detected!</span>
                                  {lastDetectedFinger.isMapped ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      ✅ Student: {lastDetectedFinger.studentName}
                                      {lastDetectedFinger.seatNumber
                                        ? ` (Seat ${lastDetectedFinger.seatNumber})`
                                        : ''}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                      ✨ Nayi Ungli / Unmapped ➔ Slot #{lastDetectedFinger.fingerId} auto-fill ho gya!
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] opacity-80 mt-0.5">
                                  {lastDetectedFinger.isMapped
                                    ? `Punch registered at ${lastDetectedFinger.timestamp} (In/Out Auto-Toggled)`
                                    : 'Neeche student choose karein aur "Assign Slot" par click karein.'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLastDetectedFinger(null)}
                              className="text-xs opacity-60 hover:opacity-100 px-2 py-1 rounded-lg hover:bg-black/5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <Fingerprint size={20} className="text-indigo-600 shrink-0" />
                            <div className="text-xs">
                              <span className="font-bold text-indigo-900">
                                🔍 Pata Kaise Karein (Student Finger Mapping):
                              </span>{' '}
                              Machine par student ka thumb punch record karte waqt Slot # (1, 2, 3) yaad rakhein ya neeche form me student ko slot assign karke &quot;Test Punch&quot; dabayein.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Slot Form */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Finger Slot #
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={newFingerId}
                            onChange={(e) => setNewFingerId(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Select Student
                          </label>
                          <select
                            value={newMappedStudentId}
                            onChange={(e) => setNewMappedStudentId(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">-- Choose Student --</option>
                            {allStudents.map((s) => (
                              <option
                                key={s._id || s.id || s.studentId}
                                value={getStudentDisplayId(s) || s.studentId}
                              >
                                {s.name} ({getStudentDisplayId(s) || s.studentId}){' '}
                                {s.seatNumber ? `• Seat ${s.seatNumber}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="button"
                            onClick={handleSaveMapping}
                            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Assign Slot
                          </button>
                        </div>
                      </div>

                      {/* List of Mappings */}
                      {fingerMappings.length > 0 ? (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {fingerMappings.map((m) => (
                            <div
                              key={m.fingerId}
                              className="px-3.5 py-2.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 font-mono font-bold border border-indigo-200 text-[11px]">
                                  Slot #{m.fingerId}
                                </span>
                                <div>
                                  <span className="font-semibold text-slate-800">
                                    {m.studentName}
                                  </span>
                                  <span className="text-[11px] text-slate-400 ml-2">
                                    Seat: {m.seatNumber || '--'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isPunchSyncing}
                                  onClick={() => handleWifiPunch(m.fingerId, m.studentId)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Test Punch via WiFi"
                                >
                                  <Send size={11} />
                                  <span>Test Punch</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMapping(m.fingerId)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Mapping"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          No finger slots mapped yet. Select a student and assign slot above.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Bluetooth BLE Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                            isBiometricConnected
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Radio size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-800">
                              {biometricDeviceName}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isBiometricConnected
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isBiometricConnected ? '🟢 Connected' : '⚪ Disconnected'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {isBiometricConnected
                              ? 'Live GATT notifications active • ready for thumb punches'
                              : 'Ensure device is powered (Stable Blue light) and within Bluetooth range'}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isBiometricConnected ? (
                          <button
                            type="button"
                            onClick={handleDisconnectBiometric}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleConnectBiometric}
                            disabled={isConnectingBle}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Radio size={14} className={isConnectingBle ? 'animate-spin' : ''} />
                            <span>{isConnectingBle ? 'Connecting...' : 'Connect Scanner'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <strong>ℹ️ Note for PC Users:</strong> Agar aapke PC me Bluetooth card nahi hai ya browser me scanner device list nahi ho raha hai, to <strong>&quot;WiFi Network / LAN&quot;</strong> tab use karein. Aapka scanner already WiFi se connected hai!
                    </div>

                    {/* Live Bluetooth Terminal Log */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal size={14} className="text-indigo-500" />
                          <span>Live Device Communication Logs</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Real-time BLE Packet Feed
                        </span>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] text-emerald-400/90 h-40 overflow-y-auto space-y-1">
                        {biometricLogs.length === 0 ? (
                          <div className="text-slate-600 italic">
                            Ready. Click &quot;Connect Scanner&quot; above to begin BLE handshake.
                          </div>
                        ) : (
                          biometricLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed break-all">
                              {log}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Galaxy Library Attendance • Real-time WiFi & BLE Biometric Sync
                </div>
                <button
                  type="button"
                  onClick={() => setIsBiometricModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Session / Punch Timeline Breakdown Modal */}
      <AnimatePresence>
        {selectedSessionRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                    <History size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">
                      {selectedSessionRecord.studentName}
                    </h2>
                    <p className="text-xs text-blue-100 flex items-center gap-2">
                      <span>{selectedSessionRecord.studentId}</span>
                      <span>•</span>
                      <span>Seat: {selectedSessionRecord.seatNumber || '--'}</span>
                      <span>•</span>
                      <span>{selectedSessionRecord.date}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSessionRecord(null)}
                  className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Stats in Modal */}
              <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Total Study Time
                    </span>
                    <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                      {selectedSessionRecord.timeSpentFormatted || '0m'}
                    </span>
                    <span className="text-[10px] text-emerald-600/80">Net time inside library</span>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                      Total Punches / Sessions
                    </span>
                    <span className="text-lg font-bold text-amber-700 mt-0.5 block">
                      {selectedSessionRecord.sessions?.length || 1} Sessions
                    </span>
                    <span className="text-[10px] text-amber-600/80">Breaks automatically deducted</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-blue-600" />
                    <span>Daily In/Out Punch Log & Break Breakdown</span>
                  </h3>

                  <div className="space-y-2.5">
                    {selectedSessionRecord.sessions && selectedSessionRecord.sessions.length > 0 ? (
                      selectedSessionRecord.sessions.map((session, idx) => {
                        const nextSession = selectedSessionRecord.sessions?.[idx + 1];
                        const breakMinutes =
                          session.outTime && nextSession?.inTime
                            ? calculateMinutes(session.outTime, nextSession.inTime, selectedSessionRecord.date)
                            : 0;

                        return (
                          <div key={idx} className="space-y-2">
                            {/* Session Card */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[11px]">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-emerald-600 flex items-center gap-1 font-mono">
                                      <LogIn size={12} /> {session.inTime}
                                    </span>
                                    <ArrowRight size={12} className="text-slate-400" />
                                    {session.outTime ? (
                                      <span className="font-bold text-blue-600 flex items-center gap-1 font-mono">
                                        <LogOut size={12} /> {session.outTime}
                                      </span>
                                    ) : (
                                      <span className="font-bold text-emerald-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Inside Now
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    Method: {session.method || 'Biometric'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-bold text-slate-700">
                                  {session.outTime
                                    ? formatMinutesToDisplay(session.durationMinutes)
                                    : 'Live (Running)'}
                                </span>
                                <span className="block text-[10px] text-slate-400">Study duration</span>
                              </div>
                            </div>

                            {/* Break Indicator between sessions */}
                            {breakMinutes > 0 && (
                              <div className="flex items-center justify-center gap-2 py-1 text-[11px] font-semibold text-amber-600 bg-amber-50/60 rounded-xl border border-dashed border-amber-200">
                                <Coffee size={13} />
                                <span>
                                  ☕ Break (Outside): {formatMinutesToDisplay(breakMinutes)} ({session.outTime} ➔ {nextSession?.inTime})
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LogIn size={14} className="text-emerald-500" />
                          <span className="font-mono font-bold">{selectedSessionRecord.inTime}</span>
                          <ArrowRight size={12} className="text-slate-400" />
                          <span className="font-mono font-bold">
                            {selectedSessionRecord.outTime || 'Inside Now'}
                          </span>
                        </div>
                        <span className="font-bold text-slate-700">
                          {selectedSessionRecord.timeSpentFormatted}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSessionRecord(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
