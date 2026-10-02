import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import { FileText, Download, FileSpreadsheet, TrendingUp, Users, IndianRupee, Calendar, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportApi } from '../lib/apiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

const colorMap = {
  blue: { bg: 'bg-[#dbeafe]', icon: 'text-[#3b82f6]' },
  green: { bg: 'bg-[#dcfce7]', icon: 'text-[#22c55e]' },
  yellow: { bg: 'bg-[#fef9c3]', icon: 'text-[#eab308]' },
  red: { bg: 'bg-[#fee2e2]', icon: 'text-[#ef4444]' },
};

const iconMap: Record<string, typeof FileText> = {
  IndianRupee,
  Users,
  Calendar,
  TrendingUp,
};

const PERIOD_OPTIONS = [
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

type ReportSummary = {
  periodLabel: string;
  dateRange: string;
  totalCollected: number;
  totalDiscount: number;
  totalPending: number;
  totalAdmissions: number;
  totalPayments: number;
  expiredCount: number;
  paymentStatus: { fullPaid: number; partial: number; unpaid: number };
};

const defaultSummary: ReportSummary = {
  periodLabel: 'This Month',
  dateRange: '',
  totalCollected: 0,
  totalDiscount: 0,
  totalPending: 0,
  totalAdmissions: 0,
  totalPayments: 0,
  expiredCount: 0,
  paymentStatus: { fullPaid: 0, partial: 0, unpaid: 0 },
};

type AdmissionStudent = {
  studentDisplayId: string;
  name: string;
  joiningDate: string;
  contact: string;
};

type AdmissionDetail = {
  course: string;
  count: number;
  students: AdmissionStudent[];
};

type FeeCollectionRecord = {
  id?: string;
  receiptNumber: string;
  studentDisplayId: string;
  studentName: string;
  course: string;
  contact: string;
  month: string;
  dayName?: string;
  monthYear?: string;
  total: number;
  payment: number;
  discount: number;
  paymentMode: string;
  paymentDate: string | Date;
};

type StudentPaymentRecord = {
  studentId: string;
  studentDisplayId: string;
  name: string;
  course?: string;
  contact?: string;
  monthlyFee?: number;
  paid: number;
  due: number;
  status?: string;
};

type ExpiredStudentRecord = {
  studentDisplayId: string;
  name: string;
  course?: string;
  contact?: string;
  status: string;
  inactiveDate?: string | Date;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatReportDate = (value?: string | Date) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDayName = (dateVal: string | Date | undefined) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '-';
  return DAY_NAMES[d.getDay()];
};

const getMonthYear = (dateVal: string | Date | undefined) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '-';
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Reports() {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [notification, setNotification] = useState('');
  const [feeData, setFeeData] = useState<{ month: string; collected: number; discount?: number; pending?: number }[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.feeData || []);
  const [feeCollectionDetails, setFeeCollectionDetails] = useState<FeeCollectionRecord[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.feeCollectionDetails || []);
  const [studentPayments, setStudentPayments] = useState<StudentPaymentRecord[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.studentPayments || []);
  const [expiredStudents, setExpiredStudents] = useState<ExpiredStudentRecord[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.expiredStudents || []);
  const [admissionData, setAdmissionData] = useState<{ name: string; value: number; color: string }[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.admissionData || []);
  const [admissionDetails, setAdmissionDetails] = useState<AdmissionDetail[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.admissionDetails || []);
  const [reportCards, setReportCards] = useState<any[]>(() => reportApi.getCachedReportsData?.('thisMonth')?.reportCards || []);
  const [summary, setSummary] = useState<ReportSummary>(() => reportApi.getCachedReportsData?.('thisMonth')?.summary || defaultSummary);
  const [loading, setLoading] = useState(() => !reportApi.getCachedReportsData?.('thisMonth'));

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    const cached = reportApi.getCachedReportsData(dateRange);
    if (!cached) {
      setLoading(true);
    }
    try {
      const data = await reportApi.getReportsData(dateRange);
      setFeeData(data.feeData || []);
      setFeeCollectionDetails(data.feeCollectionDetails || []);
      setStudentPayments(data.studentPayments || []);
      setExpiredStudents(data.expiredStudents || []);
      setAdmissionData(data.admissionData || []);
      setAdmissionDetails(data.admissionDetails || []);
      setReportCards(data.reportCards || []);
      setSummary(data.summary || defaultSummary);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      showNotification('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  const getAdmissionExportRows = () => {
    const rows: (string | number)[][] = [];

    admissionDetails.forEach((group) => {
      group.students.forEach((student) => {
        rows.push([
          student.name,
          student.studentDisplayId,
          group.course,
          formatReportDate(student.joiningDate),
          student.contact || '-',
        ]);
      });
    });

    return rows;
  };

  const getReportData = (title: string) => {
    if (title === 'Fee Collection Report') {
      const isWeek = dateRange === 'thisWeek';
      const isYear = dateRange === 'thisYear';

      const columns = isWeek
        ? ['Student Name', 'Student ID', 'Day', 'Payment Date', 'Fee Month', 'Total (₹)', 'Payment (₹)', 'Discount (₹)', 'Receipt No', 'Contact']
        : isYear
        ? ['Student Name', 'Student ID', 'Month', 'Payment Date', 'Fee Month', 'Total (₹)', 'Payment (₹)', 'Discount (₹)', 'Receipt No', 'Contact']
        : ['Student Name', 'Student ID', 'Date', 'Day', 'Fee Month', 'Total (₹)', 'Payment (₹)', 'Discount (₹)', 'Receipt No', 'Contact'];

      if (feeCollectionDetails.length === 0) {
        return {
          columns,
          rows: [['No fee collections recorded in this period', '-', '-', '-', '-', 0, 0, 0, '-', '-']],
        };
      }

      const rows: (string | number)[][] = feeCollectionDetails.map((f) => {
        const day = f.dayName || getDayName(f.paymentDate);
        const monthYear = f.monthYear || getMonthYear(f.paymentDate);
        const pDate = formatReportDate(f.paymentDate);

        if (isWeek) {
          return [
            f.studentName || '-',
            f.studentDisplayId || '-',
            day,
            pDate,
            f.month || '-',
            f.total,
            f.payment,
            f.discount,
            f.receiptNumber || '-',
            f.contact || '-',
          ];
        }

        if (isYear) {
          return [
            f.studentName || '-',
            f.studentDisplayId || '-',
            monthYear,
            pDate,
            f.month || '-',
            f.total,
            f.payment,
            f.discount,
            f.receiptNumber || '-',
            f.contact || '-',
          ];
        }

        // isMonth
        return [
          f.studentName || '-',
          f.studentDisplayId || '-',
          pDate,
          day,
          f.month || '-',
          f.total,
          f.payment,
          f.discount,
          f.receiptNumber || '-',
          f.contact || '-',
        ];
      });

      const sumTotal = feeCollectionDetails.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
      const sumPayment = feeCollectionDetails.reduce((acc, f) => acc + (Number(f.payment) || 0), 0);
      const sumDiscount = feeCollectionDetails.reduce((acc, f) => acc + (Number(f.discount) || 0), 0);

      rows.push(['TOTAL', '-', '-', '-', '-', sumTotal, sumPayment, sumDiscount, '-', '-']);

      return {
        columns,
        rows,
      };
    }

    if (title === 'Pending Fees Report') {
      const pendingList = studentPayments.filter((s) => (Number(s.due) || 0) > 0);
      if (pendingList.length === 0) {
        return {
          columns: ['Student Name', 'Student ID', 'Course', 'Contact', 'Monthly Fee (₹)', 'Paid (₹)', 'Due Amount (₹)', 'Status'],
          rows: [['No pending dues found for active students', '-', '-', '-', 0, 0, 0, 'All Paid']],
        };
      }

      const rows: (string | number)[][] = pendingList.map((s) => [
        s.name || '-',
        s.studentDisplayId || '-',
        s.course || 'Library',
        s.contact || '-',
        s.monthlyFee || 0,
        s.paid || 0,
        s.due || 0,
        s.status || 'Due',
      ]);

      const sumMonthly = pendingList.reduce((acc, s) => acc + (Number(s.monthlyFee) || 0), 0);
      const sumPaid = pendingList.reduce((acc, s) => acc + (Number(s.paid) || 0), 0);
      const sumDue = pendingList.reduce((acc, s) => acc + (Number(s.due) || 0), 0);

      rows.push(['TOTAL', '-', '-', '-', sumMonthly, sumPaid, sumDue, '-']);

      return {
        columns: ['Student Name', 'Student ID', 'Course', 'Contact', 'Monthly Fee (₹)', 'Paid (₹)', 'Due Amount (₹)', 'Status'],
        rows,
      };
    }

    if (title === 'Admission Report') {
      const rows = getAdmissionExportRows();
      return {
        columns: ['Student Name', 'Student ID', 'Course', 'Joining Date', 'Contact'],
        rows: rows.length > 0 ? rows : [['No admissions in this period', '-', '-', '-', '-']],
      };
    }

    if (title === 'Student Status Report') {
      if (expiredStudents.length === 0) {
        return {
          columns: ['Student Name', 'Student ID', 'Course', 'Contact', 'Status', 'Inactive / Expiry Date'],
          rows: [['No expired students found', '-', '-', '-', 'Active', '-']],
        };
      }
      return {
        columns: ['Student Name', 'Student ID', 'Course', 'Contact', 'Status', 'Inactive / Expiry Date'],
        rows: expiredStudents.map((s) => [
          s.name || '-',
          s.studentDisplayId || '-',
          s.course || 'Library',
          s.contact || '-',
          s.status || 'Expired',
          formatReportDate(s.inactiveDate),
        ]),
      };
    }

    const card = reportCards.find((c) => c.title === title);
    return {
      columns: ['Metric', 'Value'],
      rows: [[card?.subtitle || 'Data', card?.stat || 'N/A']],
    };
  };

  const handlePDF = (title: string) => {
    showNotification(`Generating PDF: ${title}...`);
    try {
      const data = getReportData(title);
      const isWide = data.columns.length > 5;
      const doc = new jsPDF(isWide ? 'landscape' : 'portrait');
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 22);
      if (summary.dateRange) {
        doc.text(`Period: ${summary.periodLabel} (${summary.dateRange})`, 14, 28);
      }

      const discountColIndex = data.columns.findIndex((c) => c.toLowerCase().includes('discount'));

      autoTable(doc, {
        startY: summary.dateRange ? 34 : 28,
        head: [data.columns],
        body: data.rows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [59, 130, 246] },
        didParseCell: (hookData) => {
          // If this is the TOTAL row
          const rawRow = hookData.row.raw;
          const firstCell = Array.isArray(rawRow)
            ? (rawRow as unknown[])[0]
            : (rawRow as HTMLTableRowElement).cells?.item(0)?.textContent;
          if (hookData.section === 'body' && String(firstCell ?? '').toUpperCase() === 'TOTAL') {
            hookData.cell.styles.fontStyle = 'bold';
            hookData.cell.styles.fillColor = [241, 245, 249];
            hookData.cell.styles.textColor = [15, 23, 42];
          }

          // If this is the Discount column
          if (discountColIndex !== -1 && hookData.column.index === discountColIndex && hookData.section === 'body') {
            hookData.cell.styles.textColor = [234, 88, 12]; // Orange (#ea580c)
            hookData.cell.styles.fontStyle = 'bold';
          }
        },
      });

      doc.save(`${title.replace(/\s+/g, '_')}_${dateRange}.pdf`);
    } catch (e) {
      console.error(e);
      showNotification('Error generating PDF');
    }
  };

  const handleExcel = async (title: string) => {
    showNotification(`Generating Excel: ${title}...`);
    try {
      const data = getReportData(title);
      const workbook = new ExcelJS.Workbook();
      const safeSheetName = title.slice(0, 31).replace(/[\\/?*\[\]]/g, '');
      const worksheet = workbook.addWorksheet(safeSheetName);

      // Header row with blue background and bold white text
      const headerRow = worksheet.addRow(data.columns);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      const discountColIdx = data.columns.findIndex((c) => c.toLowerCase().includes('discount')) + 1;

      // Data rows
      data.rows.forEach((rowValues) => {
        const isTotalRow = String(rowValues[0]).toUpperCase() === 'TOTAL';
        const row = worksheet.addRow(rowValues);
        row.height = 20;

        if (isTotalRow) {
          row.font = { bold: true };
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' },
          };
        }

        // Orange color for Discount column
        if (discountColIdx > 0) {
          const discountCell = row.getCell(discountColIdx);
          discountCell.font = {
            bold: isTotalRow || Number(discountCell.value) > 0,
            color: { argb: 'FFEA580C' }, // Orange (#ea580c)
          };
        }
      });

      // Auto-fit column widths
      worksheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const val = cell.value ? String(cell.value) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        column.width = Math.min(maxLen + 4, 32);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_${dateRange}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showNotification('Error generating Excel');
    }
  };

  const chartData = feeData.length > 0 ? feeData : [{ month: 'No Data', collected: 0, pending: 0 }];
  const selectedPeriod = PERIOD_OPTIONS.find((option) => option.value === dateRange)?.label || 'This Month';

  return (
    <div>
      <TopHeader />

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 px-4 py-3 bg-[#3b82f6] text-white text-sm font-medium rounded-lg shadow-lg"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="page-card mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#dbeafe] rounded-lg flex items-center justify-center">
                <FileText className="text-[#3b82f6]" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#1e293b]">Reports</h2>
                <p className="text-sm text-[#64748b]">
                  {loading ? 'Loading analytics...' : `${summary.periodLabel} · ${summary.dateRange}`}
                </p>
              </div>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#3b82f6] transition-all text-sm bg-white"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Collected', value: `₹${summary.totalCollected.toLocaleString('en-IN')}`, color: 'text-[#3b82f6]' },
            { label: 'Discount', value: `₹${(summary.totalDiscount || 0).toLocaleString('en-IN')}`, color: 'text-[#8b5cf6]' },
            { label: 'Pending', value: `₹${summary.totalPending.toLocaleString('en-IN')}`, color: 'text-[#f59e0b]' },
            { label: 'Admissions', value: summary.totalAdmissions.toString(), color: 'text-[#22c55e]' },
            { label: 'Payments', value: summary.totalPayments.toString(), color: 'text-[#6366f1]' },
            { label: 'Fully Paid', value: summary.paymentStatus.fullPaid.toString(), color: 'text-[#22c55e]' },
            { label: 'Due / Unpaid', value: (summary.paymentStatus.partial + summary.paymentStatus.unpaid).toString(), color: 'text-[#ef4444]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[10px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <p className="text-xs text-[#64748b] mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          {loading ? (
            <div className="col-span-full py-10 text-center text-[#64748b]">Loading report cards...</div>
          ) : (
            reportCards.map((card, index) => {
              const colors = colorMap[card.color as keyof typeof colorMap] || colorMap.blue;
              const Icon = iconMap[card.iconName] || FileText;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                  className="page-card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={colors.icon} size={20} />
                    </div>
                    {card.trend && (
                      <span className="text-xs font-medium text-[#64748b] flex items-center gap-1">
                        <Clock size={12} />
                        {card.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-[#1e293b] mb-1">{card.stat}</p>
                  <p className="text-sm text-[#64748b] mb-4">{card.subtitle}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePDF(card.title)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3b82f6] bg-[#dbeafe] rounded-md hover:bg-[#bfdbfe] transition-colors"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    <button
                      onClick={() => handleExcel(card.title)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#22c55e] bg-[#dcfce7] rounded-md hover:bg-[#bbf7d0] transition-colors"
                    >
                      <FileSpreadsheet size={14} />
                      Excel
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="page-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1e293b]">Fee Collection</h3>
              <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded-md">{selectedPeriod}</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-[#64748b]">Loading chart...</div>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} interval={dateRange === 'thisYear' ? 0 : 'preserveStartEnd'} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
                  />
                  <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                </BarChart>
              )}
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#eff6ff] rounded-lg">
                <p className="text-xs text-[#64748b]">Total Collected</p>
                <p className="text-sm font-bold text-[#3b82f6]">₹{summary.totalCollected.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center p-3 bg-[#fffbeb] rounded-lg">
                <p className="text-xs text-[#64748b]">Total Pending</p>
                <p className="text-sm font-bold text-[#f59e0b]">₹{summary.totalPending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="page-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1e293b]">Admission Distribution</h3>
              <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded-md">{summary.totalAdmissions} total</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-[#64748b]">Loading chart...</div>
              ) : admissionData.length > 0 ? (
                <PieChart>
                  <Pie data={admissionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                    {admissionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#64748b]">
                  <Users size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">No admissions in {selectedPeriod.toLowerCase()}</p>
                </div>
              )}
            </ResponsiveContainer>
            {!loading && admissionData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {admissionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-[#64748b]">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
