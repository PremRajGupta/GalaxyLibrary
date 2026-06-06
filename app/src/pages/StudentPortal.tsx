import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { studentPortalApi } from '../lib/apiService';
import { 
  LogOut, User, Calendar, CreditCard, Clock, Phone, MapPin, 
  CheckCircle, AlertCircle, Receipt, ShieldCheck, Mail
} from 'lucide-react';
import { getInitials, getAvatarColor } from '../sections/students/students';
import { getCourseLabel } from '../lib/courseOptions';
import { formatJoiningDate } from '../lib/formatDate';
import S from '../lib/strings';
import AppLogo from '../components/AppLogo';

const RUPEE = '\u20B9';
const formatRupee = (amount: number) => `${RUPEE}${amount.toLocaleString('en-IN')}`;

export default function StudentPortal() {
  const { logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await studentPortalApi.getMyDetails();
        setData(res);
      } catch (err: any) {
        console.error('Error fetching student details:', err);
        setError(err.message || 'Failed to load details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mb-4" />
        <h2 className="text-lg font-semibold text-[#1e293b]">{S.appName} Student Portal</h2>
        <p className="text-sm text-[#64748b] mt-1">Fetching your dashboard...</p>
      </div>
    );
  }

  if (error || !data || !data.student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <AlertCircle className="mx-auto text-red-500 w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold text-[#1e293b] mb-2">Error Loading Portal</h2>
          <p className="text-sm text-[#64748b] mb-6">{error || 'Student details could not be retrieved.'}</p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-[#1a2b4a] text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#2a3b5a] transition-all"
          >
            <LogOut size={16} /> Logout & Re-login
          </button>
        </div>
      </div>
    );
  }

  const { student, fees, validity } = data;
  const paymentHistory = fees || [];
  const seatNumber = student.seatNumber && student.seatNumber !== '--' ? student.seatNumber : 'N/A';
  const shiftText = student.timeShift || 'N/A';

  // Calculate fees status using computed backend dues
  const { dues } = data;
  const pendingAmount = dues?.pendingAmount ?? 0;
  const totalPaidAmount = dues?.paidAmount ?? 0;

  const isInactive = student.status === 'inactive';
  let feeStatus: 'paid' | 'due' | 'inactive' = 'due';
  let statusColor = 'text-red-600 bg-red-50 border-red-200';
  let statusText = 'Payment Due';

  if (isInactive) {
    feeStatus = 'inactive';
    statusColor = 'text-gray-500 bg-gray-50 border-gray-200';
    statusText = 'Inactive Account';
  } else if (pendingAmount === 0) {
    feeStatus = 'paid';
    statusColor = 'text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]';
    statusText = 'Fees Paid';
  }

  // Get last payment date
  const lastPayment = paymentHistory[0]; // array is sorted by date desc

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header bar */}
      <header className="bg-gradient-to-r from-[#1a2b4a] to-[#0f172a] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="md" className="flex-shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">{S.appName} Student Portal</h1>
              <p className="text-xs text-blue-200 font-medium">Digital Library Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-all border border-white/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Welcome greeting card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img 
                src={student.photo} 
                alt={student.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#3b82f6]" 
              />
            ) : (
              <div className={`w-16 h-16 ${getAvatarColor(student.name)} rounded-full flex items-center justify-center text-2xl text-white font-bold border-2 border-white shadow-sm`}>
                {getInitials(student.name)}
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Hello, {student.name}!</h2>
              <p className="text-sm text-[#64748b]">Welcome back to your library dashboard.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold shadow-sm ${statusColor}`}>
              {feeStatus === 'paid' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {statusText}
            </div>
            <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-sm font-semibold shadow-sm">
              ID: {student.studentId}
            </div>
          </div>
        </div>

        {/* Advance Payment Banner */}
        {validity?.hasAdvancePayment && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <span className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 mt-1 sm:mt-0">
                <ShieldCheck size={24} className="animate-pulse" />
              </span>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-base sm:text-lg">Advance Payment Active ⚡</h4>
                <p className="text-sm text-emerald-800/90 mt-1">
                  You have paid fees for <span className="font-bold">{validity.monthsCovered} Month{validity.monthsCovered !== 1 ? 's' : ''}</span> in advance. 
                  Your membership validity is fully secure.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end justify-center">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">
                {validity.daysRemaining} Days Left
              </span>
              <span className="text-xs font-semibold text-emerald-700 mt-0.5">
                Valid until {new Date(validity.validUntilDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Seat details card */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1e293b]">Seat Assignment</h3>
                <span className="p-2 bg-[#eff6ff] text-[#3b82f6] rounded-xl"><Clock size={20} /></span>
              </div>
              <div className="my-6 text-center">
                <p className="text-xs text-[#94a3b8] uppercase font-bold tracking-wider mb-1">Your Assigned Seat</p>
                <div className="text-4xl font-extrabold text-[#1a2b4a] tracking-tight bg-slate-50 py-4 rounded-xl border border-slate-100 max-w-[180px] mx-auto">
                  {seatNumber}
                </div>
              </div>
            </div>
            <div className="border-t border-[#f1f5f9] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Time Shift:</span>
                <span className="font-semibold text-[#1e293b]">{getCourseLabel(shiftText)}</span>
              </div>
              {student.customShiftHours && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Duration:</span>
                  <span className="font-semibold text-[#1e293b]">{student.customShiftHours} Hours</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Fee details card */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1e293b]">Fee Details</h3>
                <span className="p-2 bg-[#f0fdf4] text-[#16a34a] rounded-xl"><CreditCard size={20} /></span>
              </div>
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-[#94a3b8] font-semibold mb-1">Monthly Fee</p>
                  <p className="text-lg font-bold text-[#1e293b]">{formatRupee(student.feeAmount || 0)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-[#94a3b8] font-semibold mb-1">Valid Upto</p>
                  <p className="text-sm font-bold text-[#1e293b] truncate">
                    {validity?.validUntilDate 
                      ? new Date(validity.validUntilDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : lastPayment?.validUntilDate 
                        ? new Date(lastPayment.validUntilDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'N/A'}
                  </p>
                </div>
                <div className="bg-[#f0fdf4] p-3 rounded-xl border border-[#bbf7d0] text-[#16a34a]">
                  <p className="text-xs font-semibold mb-1">Total Paid</p>
                  <p className="text-lg font-bold">{formatRupee(totalPaidAmount)}</p>
                </div>
                <div className={`${pendingAmount > 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-[#1e293b]'} p-3 rounded-xl border`}>
                  <p className={`text-xs ${pendingAmount > 0 ? 'text-red-700 font-semibold' : 'text-[#94a3b8] font-semibold'} mb-1`}>Payment Due</p>
                  <p className="text-lg font-bold">{formatRupee(pendingAmount)}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-[#f1f5f9] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Payment Mode:</span>
                <span className="font-semibold text-[#1e293b] capitalize">{student.paymentMode || 'Cash'}</span>
              </div>
              {/* redundant valid until date removed from here */}
              {validity?.hasAdvancePayment ? (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Advance Covered:</span>
                  <span className="font-semibold text-[#3b82f6]">
                    {validity.advanceMonths} Month{validity.advanceMonths !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : lastPayment?.isAdvancePayment && lastPayment?.monthsCovered && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Advance Covered:</span>
                  <span className="font-semibold text-[#3b82f6]">
                    {lastPayment.monthsCovered} Month{lastPayment.monthsCovered !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {validity?.hasAdvancePayment && (
                <div className="flex justify-between text-sm border-t border-slate-100 pt-2 mt-2">
                  <span className="text-[#64748b] flex items-center gap-1">
                    <Clock size={14} className="text-[#3b82f6]" /> Advance Remaining:
                  </span>
                  <span className="font-bold text-[#3b82f6]">
                    {validity.daysRemaining} Days left
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Support card */}
          <motion.div 
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1e293b]">Help & Assistance</h3>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShieldCheck size={20} /></span>
              </div>
              <p className="text-sm text-[#64748b] mb-4">Need help with seat transfer, shifts, or fee corrections? Get in touch with the administrator.</p>
            </div>
            <div className="space-y-3 pt-2">
              <a 
                href="tel:7488252019" 
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-[#e2e8f0] rounded-xl text-sm font-semibold text-[#1e293b] flex items-center justify-center gap-2 transition-all"
              >
                <Phone size={16} className="text-blue-600" /> Call Librarian
              </a>
              <a 
                href="https://wa.me/917488252019" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-2.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 rounded-xl text-sm font-semibold text-[#075e54] flex items-center justify-center gap-2 transition-all"
              >
                <Phone size={16} className="text-[#25d366]" /> WhatsApp Support
              </a>
            </div>
          </motion.div>
        </div>

        {/* Details and Payments Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6">
            <h3 className="font-bold text-lg text-[#0f172a] mb-6 flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
              <User size={18} className="text-[#3b82f6]" /> Student Profile
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Full Name</p>
                <p className="font-medium text-[#1e293b]">{student.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Father's Name</p>
                  <p className="font-medium text-[#1e293b]">{student.fatherName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Mother's Name</p>
                  <p className="font-medium text-[#1e293b]">{student.motherName || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Mobile</p>
                  <p className="font-medium text-[#1e293b]">{student.mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Course/Class</p>
                  <p className="font-medium text-[#1e293b]">{student.course}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Email Address</p>
                <p className="font-medium text-[#1e293b] flex items-center gap-1.5"><Mail size={14} className="text-[#64748b]" /> {student.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Joining Date</p>
                <p className="font-medium text-[#1e293b] flex items-center gap-1.5"><Calendar size={14} className="text-[#64748b]" /> {formatJoiningDate(student.joiningDate || student.admissionDate)}</p>
              </div>
              <div>
                <p className="text-xs text-[#94a3b8] font-semibold uppercase mb-0.5">Registered Address</p>
                <p className="font-medium text-[#1e293b] flex items-start gap-1.5"><MapPin size={14} className="text-[#64748b] mt-0.5 flex-shrink-0" /> {student.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payment History Ledger */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] p-6 lg:col-span-2">
            <h3 className="font-bold text-lg text-[#0f172a] mb-6 flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
              <Receipt size={18} className="text-[#16a34a]" /> Payment History & Receipts
            </h3>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-12 text-[#64748b] space-y-3">
                <Receipt size={40} className="mx-auto text-[#cbd5e1]" />
                <p className="font-medium">No payment history found</p>
                <p className="text-xs text-[#94a3b8]">Fee receipts will appear here once recorded by the admin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#64748b] border-b border-[#f1f5f9] pb-2">
                      <th className="font-semibold pb-3">Receipt No</th>
                      <th className="font-semibold pb-3">Payment Date</th>
                      <th className="font-semibold pb-3">Month</th>
                      <th className="font-semibold pb-3">Mode</th>
                      <th className="font-semibold pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {paymentHistory.map((fee: any) => (
                      <tr key={fee._id} className="text-[#1e293b]">
                        <td className="py-3 font-mono text-xs font-semibold text-blue-600 bg-blue-50/50 px-2 rounded-lg max-w-[140px] truncate">
                          {fee.receiptNumber || 'MIGRATED'}
                        </td>
                        <td className="py-3 text-[#64748b]">
                          {new Date(fee.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 font-medium">{fee.month}</td>
                        <td className="py-3 capitalize text-xs">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                            {fee.paymentMode || 'cash'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-[#0f172a]">
                          {formatRupee(fee.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
