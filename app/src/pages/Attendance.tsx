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
} from 'lucide-react';
import {
  attendanceService,
  getTodayDateString,
  getCurrentTimeString,
  type AttendanceRecord,
  type AttendanceSummary,
} from '../lib/attendanceService';
import { studentApi } from '../lib/apiService';
import { getStudentDisplayId } from '../lib/studentId';
import { getTimeShiftLabel, TIME_SHIFT_OPTIONS } from '../lib/feeRules';
import { getInitials, getAvatarColor } from '../sections/students/students';

const STATUS_CONFIG = {
  present: {
    label: 'Currently Inside',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500 animate-pulse',
    icon: LogIn,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    icon: CheckCircle2,
  },
  late: {
    label: 'Late Arrival',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  half_day: {
    label: 'Half Day',
    bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    icon: Clock,
  },
  absent: {
    label: 'Absent',
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
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

  // Live Clock
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getCurrentTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Student Attendance Register
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Real-time check-in, check-out tracking, shift logs & daily study hours
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Clock Badge */}
          <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Clock size={14} className="text-blue-600" />
            <span>Live: {currentTime}</span>
          </div>

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
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Export CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => loadAttendance()}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs transition-all cursor-pointer shadow-xs active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ==================== DAYS-WISE TOP FILTER SECTION ==================== */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Days-Wise Date Filter
            </span>
          </div>

          {/* Quick Date Selectors */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => changeDateByDays(-1)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
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
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Yesterday
            </button>

            {/* Custom Date Input */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => changeDateByDays(1)}
              disabled={isToday}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isToday
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {summary.totalEnrolled}
          </div>
          <p className="text-[10px] text-slate-400">Total active students</p>
        </div>

        {/* Present Today */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-1 bg-gradient-to-b from-emerald-50/20 to-transparent">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.presentCount}
          </div>
          <p className="text-[10px] text-emerald-600/70">Checked in on {selectedDate}</p>
        </div>

        {/* Currently Inside */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-emerald-300 dark:border-emerald-700 shadow-sm space-y-1 bg-gradient-to-b from-emerald-50/50 to-transparent relative overflow-hidden">
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inside</span>
            <LogIn size={16} className="mr-3" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {summary.currentlyInsideCount}
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold">Active in Hall Now</p>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <LogOut size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.completedCount}
          </div>
          <p className="text-[10px] text-slate-400">Checked out</p>
        </div>

        {/* Absent */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent</span>
            <XCircle size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
            {summary.absentCount}
          </div>
          <p className="text-[10px] text-slate-400">Not attended</p>
        </div>

        {/* Avg Time Spent */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Study</span>
            <Clock size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.avgHoursFormatted || '0m'}
          </div>
          <p className="text-[10px] text-slate-400">Per present student</p>
        </div>
      </div>

      {/* ==================== ATTENDANCE TABLE LIST ==================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Attendance Records for {selectedDate}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredRecords.length} Students
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Student's Name</th>
                <th className="py-3.5 px-4">Shift / Plan</th>
                <th className="py-3.5 px-4">In_Time</th>
                <th className="py-3.5 px-4">Out_Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Time_Spent</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
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
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Student's Name */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.studentName}
                              className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
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
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              {item.studentName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{item.studentId}</span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
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
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap">
                          {getTimeShiftLabel(item.timeShift)}
                        </span>
                      </td>

                      {/* In_Time */}
                      <td className="py-3.5 px-4 font-mono">
                        {item.inTime ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200/70 dark:border-emerald-800/70">
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/70 dark:border-blue-800/70">
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
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-200">
                        {item.timeSpentFormatted && item.timeSpentFormatted !== '0m' ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            <Clock size={13} className="text-blue-500" />
                            {item.timeSpentFormatted}
                          </span>
                        ) : (
                          <span className="text-slate-400">0m</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If not checked in: Show Check In button */}
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

                          {/* If checked in & still inside: Show Check Out button */}
                          {isCurrentlyInside && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(item)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Mark Out"
                            >
                              <LogOut size={13} />
                              <span>Out</span>
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
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
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {editingRecord.studentId ? 'Update Attendance' : 'Mark New Attendance'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="p-6 space-y-4">
                {/* Student Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Student *
                  </label>
                  {editingRecord.studentName && editingRecord.studentId ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingRecord.date || selectedDate}
                    onChange={(e) =>
                      setEditingRecord((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* In Time & Out Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      In Time (Entry)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 08:30 AM"
                      value={editingRecord.inTime || ''}
                      onChange={(e) =>
                        setEditingRecord((prev) => ({ ...prev, inTime: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Out Time (Exit)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 02:45 PM"
                      value={editingRecord.outTime || ''}
                      onChange={(e) =>
                        setEditingRecord((prev) => ({ ...prev, outTime: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Remarks / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inquired about evening shift change"
                    value={editingRecord.remarks || ''}
                    onChange={(e) =>
                      setEditingRecord((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
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
    </div>
  );
}
