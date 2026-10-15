import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { load } from '@cashfreepayments/cashfree-js';
import { useAuth } from '../context/AuthContext';
import { studentPortalApi, requestApi } from '../lib/apiService';
import { 
  LogOut, User, Calendar, CreditCard, Clock, Phone, MapPin, 
  CheckCircle, AlertCircle, Receipt, ShieldCheck, Mail,
  MessageCircle, Users, Download, BookOpen, Monitor, MessageSquare, Send
} from 'lucide-react';
import { getInitials, getAvatarColor } from '../sections/students/students';
import { getCourseLabel } from '../lib/courseOptions';
import { formatJoiningDate } from '../lib/formatDate';
import { generateReceiptPDF, getDefaultReceiptLogo } from '../sections/fees/receiptService';
import S from '../lib/strings';
import AppLogo from '../components/AppLogo';
import ChatBot from '../components/ChatBot';
import AdmissionRequestForm from '../components/students/AdmissionRequestForm';
import CertificateTab from '../components/students/CertificateTab';

const RUPEE = '\u20B9';
const formatRupee = (amount: number) => `${RUPEE}${amount.toLocaleString('en-IN')}`;

export default function StudentPortal() {
  const { logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'payments' | 'courses' | 'feedback' | 'admission' | 'certificate'>('overview');
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [payingWithCashfree, setPayingWithCashfree] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

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

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Preload Cashfree SDK for instant payment popup
  useEffect(() => {
    load({ mode: 'production' }).catch(() => {});
  }, []);

  // Handle redirect callback if Cashfree checkout redirected back with order_id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    if (orderId && data?.student) {
      (async () => {
        try {
          const statusRes = await requestApi.getCashfreeOrderStatus(orderId);
          if (statusRes.order_status === 'PAID') {
            await requestApi.recordCashfreeFee({
              orderId,
              studentId: data.student.studentId,
              amount: Number(statusRes.order_amount) || 0
            });
            await fetchStudentData();
            alert(`Fee payment of ₹${statusRes.order_amount} verified successfully! Your receipt has been updated.`);
          }
        } catch (e) {
          console.error('Error verifying redirect fee order:', e);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })();
    }
  }, [data?.student?.studentId]);

  const handleTabClick = (tab: 'overview' | 'profile' | 'payments' | 'courses' | 'feedback' | 'admission' | 'certificate') => {
    if (data?.student?.status === 'inactive' && tab !== 'overview' && tab !== 'feedback') {
      alert("Take Admission then access, okay?");
      return;
    }
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDownloadReceipt = async (fee: any) => {
    const payment = {
      id: fee.receiptNumber || fee._id || 'MIGRATED',
      studentName: data.student.name,
      studentId: data.student.studentId,
      course: getCourseLabel(data.student.course),
      seatNumber: data.student.seatNumber || data.student.seatNumber?.toString(),
      fatherName: data.student.fatherName,
      studentMobile: data.student.mobile,
      joiningDate: data.student.joiningDate,
      amount: fee.amount || 0,
      month: fee.month,
      paymentMode: fee.paymentMode || 'cash',
      date: new Date(fee.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      notes: fee.notes || ''
    };
    await generateReceiptPDF(payment, getDefaultReceiptLogo());
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
  const fallbackPayAmount = pendingAmount > 0 ? pendingAmount : (student.feeAmount || 0);

  const handleCashfreeFeePay = async () => {
    try {
      setPaymentError('');
      const payAmount = Number(customPayAmount !== '' ? customPayAmount : fallbackPayAmount);
      if (!payAmount || payAmount < 1) {
        setPaymentError('Please enter a valid amount of at least ₹1');
        return;
      }

      setPayingWithCashfree(true);

      const frontendUrl = window.location.origin;
      const orderData = await requestApi.createCashfreeOrder(
        student.mobile,
        student.name,
        payAmount,
        student.email,
        `${frontendUrl}/student?order_id={order_id}`,
        'FEE'
      );

      if (!orderData?.paymentSessionId) {
        throw new Error('Failed to create payment session with Cashfree.');
      }

      const cashfree = await load({
        mode: orderData.environment === 'production' ? 'production' : 'sandbox'
      });

      await cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_modal'
      });

      // Verify payment status when modal closes
      const statusRes = await requestApi.getCashfreeOrderStatus(orderData.orderId);
      if (statusRes.order_status === 'PAID') {
        await requestApi.recordCashfreeFee({
          orderId: orderData.orderId,
          studentId: student.studentId,
          amount: payAmount
        });
        await fetchStudentData();
        setCustomPayAmount('');
        alert(`Payment of ₹${payAmount} was successful! Your fee receipt and dues have been updated.`);
      } else if (statusRes.order_status === 'ACTIVE') {
        setPaymentError('Payment was cancelled or not completed. Please try again.');
      } else {
        setPaymentError(`Payment status: ${statusRes.order_status}`);
      }
    } catch (err: any) {
      console.error('Error during fee payment:', err);
      setPaymentError(err.message || 'Payment cancelled or failed.');
    } finally {
      setPayingWithCashfree(false);
    }
  };

  const advanceBalance = (validity && validity.monthlyFee > 0 && validity.totalPaid && pendingAmount === 0) 
    ? validity.totalPaid % validity.monthlyFee 
    : 0;

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
    <div className="min-h-screen bg-[#eef2f6] relative overflow-hidden">
      {/* Animated Background Blobs for Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300/30 blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/30 blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Header bar */}
      <header className="bg-[#1a2b4a]/95 backdrop-blur-xl text-white shadow-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <AppLogo size="sm" className="flex-shrink-0 drop-shadow-md" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg lg:text-xl font-black tracking-tight truncate">{S.appName} Student Portal</h1>
              <p className="text-[10px] sm:text-[11px] text-blue-200/80 font-bold uppercase tracking-wider hidden sm:block">Digital Library Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold transition-all border border-white/10 shadow-sm flex-shrink-0"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 relative z-10">
        
        {/* Welcome greeting card (Glassmorphism) */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-3 sm:p-4 lg:p-5 mb-4 sm:mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 sm:gap-5 relative z-10">
            {student.photo ? (
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-30 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                <img 
                  src={student.photo} 
                  alt={student.name} 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 sm:border-4 border-white shadow-xl relative z-10" 
                />
              </div>
            ) : (
              <div className={`w-12 h-12 sm:w-16 sm:h-16 ${getAvatarColor(student.name)} rounded-full flex items-center justify-center text-xl sm:text-3xl text-white font-black border-2 sm:border-4 border-white shadow-xl relative z-10 flex-shrink-0`}>
                {getInitials(student.name)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#0f172a] tracking-tight mb-0.5 sm:mb-1 truncate">Hello, {student.name}! 👋</h2>
              <p className="text-xs sm:text-sm font-semibold text-[#64748b]">Welcome back to your digital dashboard.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10">
            <div className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-bold shadow-sm transition-all ${statusColor}`}>
              {feeStatus === 'paid' ? <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> : <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
              {statusText}
            </div>
            <div className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-100/50 text-xs sm:text-sm font-black shadow-sm tracking-wide">
              ID: {student.studentId}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex flex-wrap gap-2 sm:gap-2 bg-white/50 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white shadow-sm mb-4 sm:mb-5 w-full md:w-fit mx-0 justify-center md:justify-start">
          <button 
            onClick={() => handleTabClick('overview')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
          >
            📊 Overview
          </button>
          
          {student?.status !== 'inactive' && (
            <button 
              onClick={() => handleTabClick('profile')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'profile' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
            >
              👤 My Profile
            </button>
          )}

          {student?.status !== 'inactive' && (
            <button 
              onClick={() => handleTabClick('payments')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'payments' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
            >
              🧾 Payment History
            </button>
          )}

          {student?.status !== 'inactive' && (
            <button 
              onClick={() => handleTabClick('courses')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'courses' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
            >
              📚 Courses
            </button>
          )}

          <button 
            onClick={() => handleTabClick('feedback')}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'feedback' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
          >
            💬 Feedback
          </button>

          {student?.status !== 'inactive' && (
            <button 
              onClick={() => handleTabClick('admission')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'admission' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
            >
              🤝 Admission
            </button>
          )}

          {student?.status !== 'inactive' && (
            <button 
              onClick={() => handleTabClick('certificate')}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === 'certificate' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-[#64748b] hover:bg-white hover:text-[#1e293b]'}`}
            >
              🏅 Certificate
            </button>
          )}
        </div>

        {/* Advance Payment Banner */}
        {validity?.hasAdvancePayment && activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_10px_30px_rgba(16,185,129,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="flex items-start gap-3 sm:gap-4 relative z-10">
              <span className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl mt-0.5 sm:mt-0 border border-white/20 flex-shrink-0">
                <ShieldCheck size={24} className="sm:w-[28px] sm:h-[28px] animate-pulse" />
              </span>
              <div>
                <h4 className="font-extrabold text-base sm:text-lg lg:text-xl tracking-tight">Advance Payment Active ⚡</h4>
                <p className="text-xs sm:text-sm text-emerald-50 font-medium mt-1">
                  You have paid fees for <span className="font-black bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-md">{validity.monthsCovered} Month{validity.monthsCovered !== 1 ? 's' : ''}</span> in advance. 
                  Your membership validity is fully secure.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end justify-center relative z-10 bg-black/10 backdrop-blur-md px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/10">
              <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                {validity.daysRemaining} Days Left
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-100 mt-1 uppercase tracking-wider">
                Valid until {new Date(validity.validUntilDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        )}

        {/* -------------------- TAB 1: OVERVIEW -------------------- */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4 sm:gap-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Seat details card */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="lg:col-span-3 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white p-3 sm:p-4 lg:p-5 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="font-bold text-sm sm:text-base text-[#1e293b]">Seat Assignment</h3>
                    <span className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-50 to-indigo-50 text-[#3b82f6] rounded-lg sm:rounded-xl shadow-sm"><Clock size={18} className="sm:w-5 sm:h-5" /></span>
                  </div>
                  <div className="my-2 sm:my-4 text-center">
                    <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-widest mb-2 sm:mb-3">Your Assigned Seat</p>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-[#ffffff] to-[#f8fafc] border-4 sm:border-[6px] border-[#eff6ff] shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)] flex items-center justify-center relative group transition-all duration-300 hover:shadow-[0_10px_40px_-5px_rgba(59,130,246,0.3)] hover:scale-105 cursor-default">
                      <div className="absolute inset-0 rounded-full border border-blue-200/50 scale-[1.15] opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
                      <span className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0f172a] to-[#3b82f6] tracking-tight">
                        {seatNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100/80 pt-2 sm:pt-3 space-y-1 relative z-10">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-[#64748b] font-semibold">Time Shift:</span>
                    <span className="font-bold text-[#1e293b] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-xs sm:text-sm">{getCourseLabel(shiftText)}</span>
                  </div>
                  {student.customShiftHours && (
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-[#64748b] font-semibold">Duration:</span>
                      <span className="font-bold text-[#1e293b] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-xs sm:text-sm">{student.customShiftHours} Hours</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Fee details card */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="lg:col-span-5 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white p-3 sm:p-4 lg:p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="font-bold text-sm sm:text-base text-[#1e293b]">Fee Details</h3>
                    <span className="p-1.5 sm:p-2 bg-[#f0fdf4] text-[#16a34a] rounded-lg sm:rounded-xl"><CreditCard size={18} className="sm:w-5 sm:h-5" /></span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 my-2 sm:my-3">
                    <div className="sm:col-span-2 bg-slate-50/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-100">
                      <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-wide mb-1">Monthly Fee</p>
                      <p className="text-base sm:text-lg font-black text-[#1e293b] tracking-tight">{formatRupee(student.feeAmount || 0)}</p>
                    </div>
                    <div className="sm:col-span-2 bg-slate-50/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-100">
                      <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-wide mb-1">Valid Upto</p>
                      <p className="text-xs sm:text-sm font-bold text-[#1e293b] truncate">
                        {validity?.validUntilDate 
                          ? new Date(validity.validUntilDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : lastPayment?.validUntilDate 
                            ? new Date(lastPayment.validUntilDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'N/A'}
                      </p>
                    </div>
                    <div className="sm:col-span-2 bg-green-50/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-green-100/50 text-[#16a34a]">
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide mb-1">Total Paid</p>
                      <p className="text-base sm:text-lg font-black tracking-tight">{formatRupee(totalPaidAmount)}</p>
                    </div>
                    <div className={`${advanceBalance > 0 ? 'sm:col-span-3' : 'sm:col-span-6'} ${pendingAmount > 0 ? 'bg-red-50/80 border-red-100/50 text-red-700' : 'bg-slate-50/80 border-slate-100 text-[#1e293b]'} p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border`}>
                      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide mb-1 ${pendingAmount > 0 ? 'text-red-700' : 'text-[#94a3b8]'}`}>Payment Due</p>
                      <p className="text-base sm:text-lg font-black tracking-tight">{formatRupee(pendingAmount)}</p>
                    </div>
                    {advanceBalance > 0 && (
                      <div className="col-span-2 sm:col-span-3 bg-blue-50/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-blue-100/50 text-[#2563eb]">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide mb-1 text-blue-600">Advance Balance</p>
                        <p className="text-base sm:text-lg font-black tracking-tight">{formatRupee(advanceBalance)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-100/80 pt-2 sm:pt-3 space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#64748b] font-semibold">Payment Mode:</span>
                    <span className="font-bold text-[#1e293b] capitalize">{student.paymentMode || 'Cash'}</span>
                  </div>
                  {validity?.hasAdvancePayment ? (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#64748b] font-semibold">Advance Covered:</span>
                      <span className="font-black text-[#3b82f6]">
                        {validity.advanceMonths} Month{validity.advanceMonths !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : lastPayment?.isAdvancePayment && lastPayment?.monthsCovered && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#64748b] font-semibold">Advance Covered:</span>
                      <span className="font-black text-[#3b82f6]">
                        {lastPayment.monthsCovered} Month{lastPayment.monthsCovered !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Support card */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="lg:col-span-4 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white p-3 sm:p-4 lg:p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="font-bold text-sm sm:text-base text-[#1e293b]">Help & Support</h3>
                    <span className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-lg sm:rounded-xl"><ShieldCheck size={18} className="sm:w-5 sm:h-5" /></span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#64748b] mb-2 sm:mb-2 leading-relaxed">
                    Need help with seat transfer, shifts, or fee corrections? Contact the admin below.
                  </p>
                  <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg sm:rounded-xl p-2 sm:p-2.5 mb-2 sm:mb-3 shadow-sm">
                    <p className="text-[10px] sm:text-xs text-emerald-800 font-medium leading-snug">
                      <strong className="text-emerald-900 block mb-1 text-xs">📢 Stay Updated!</strong>
                      Join our WhatsApp group for <span className="font-bold">Daily Newspapers</span>, <span className="font-bold">Magazines</span>, Holiday Notices, and special Offers.
                    </p>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 pt-2">
                  <a 
                    href="https://chat.whatsapp.com/GEryQDQLa1QJLTSZ55nq7W" 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#25d366] to-[#1da851] hover:shadow-[0_5px_15px_rgba(37,211,102,0.3)] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <Users size={16} className="sm:w-[18px] sm:h-[18px]" /> Join WhatsApp Group
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href="tel:7488252019" 
                      className="py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-[#1e293b] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-blue-600" /> Call Admin
                    </a>
                    <a 
                      href="https://wa.me/917488252019" 
                      target="_blank" 
                      rel="noreferrer"
                      className="py-2 sm:py-2.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-[#075e54] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageCircle size={12} className="sm:w-[14px] sm:h-[14px] text-[#25d366]" /> Chat
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Payment QR Code & Online Pay Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-gradient-to-r from-[#673ab7] to-[#512da8] rounded-2xl sm:rounded-3xl shadow-lg border border-[#512da8] p-2 sm:p-4 flex flex-col lg:flex-row gap-4 relative overflow-hidden items-stretch mt-6"
            >
              {/* QR Code Left Side */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center w-full lg:min-w-[260px] lg:w-auto">
                <div className="text-center mb-2 flex items-center justify-center gap-2">
                  <div className="w-6 h-6 bg-[#673ab7] rounded-full flex items-center justify-center font-bold text-white text-xs">पे</div>
                  <span className="font-black text-[#512da8] text-lg tracking-wide drop-shadow-sm">Scan & Pay</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Any UPI App</p>
                <div className="bg-white p-2 border-2 border-gray-100 rounded-xl shadow-sm mb-2">
                  <img src="/qr-code.png" alt="Payment QR" className="w-36 h-36 sm:w-44 sm:h-44 object-contain" />
                </div>
                <p className="text-[11px] text-gray-600 font-bold tracking-wide">7488252019@okbizaxis</p>
                <div className="flex justify-center items-center gap-2 my-1">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-3.5" />
                </div>
              </div>

              {/* Right Side: Cashfree Online UPI Payment Form */}
              <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 text-white">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-lg sm:text-2xl font-black">Fee Payment via UPI</h3>
                      <p className="text-white/80 text-xs sm:text-sm">Pay your fee securely online using PhonePe, Google Pay, Paytm, or any UPI app.</p>
                    </div>
                    {pendingAmount > 0 ? (
                      <span className="self-start sm:self-auto px-3 py-1.5 rounded-full bg-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                        Total Dues: ₹{pendingAmount.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-300 text-emerald-950 font-black text-xs sm:text-sm shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                        No Dues Pending
                      </span>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div className="mb-4">
                    <label className="text-[11px] text-white/80 font-bold uppercase tracking-wider mb-1.5 block">
                      Amount to Pay (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-base sm:text-lg">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder={`e.g. ${fallbackPayAmount}`}
                        value={customPayAmount !== '' ? customPayAmount : (fallbackPayAmount > 0 ? String(fallbackPayAmount) : '')}
                        onChange={(e) => {
                          setCustomPayAmount(e.target.value);
                          setPaymentError('');
                        }}
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-black text-base sm:text-lg shadow-inner"
                      />
                    </div>
                    <p className="text-[11px] text-white/70 mt-1.5 font-medium">
                      {pendingAmount > 0 
                        ? `Pre-filled with total dues (₹${pendingAmount}). You can change the amount to pay less.`
                        : `Enter the amount you wish to pay.`}
                    </p>
                    {paymentError && (
                      <p className="mt-2 text-xs font-bold text-amber-200 bg-amber-950/50 px-3 py-2 rounded-lg border border-amber-400/30">
                        {paymentError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Cashfree Pay & Copy UPI ID */}
                <div className="space-y-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCashfreeFeePay}
                    disabled={payingWithCashfree}
                    className="w-full py-3.5 sm:py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-black rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/30 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {payingWithCashfree ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Opening Cashfree UPI Payment...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={20} />
                        Pay ₹{Number(customPayAmount !== '' ? customPayAmount : fallbackPayAmount) || 0} via Cashfree UPI
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('7488252019@okbizaxis');
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedUpi ? (
                      <><CheckCircle size={16} className="text-emerald-300" /> Copied! (7488252019@okbizaxis)</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copy UPI ID (7488252019@okbizaxis)
                      </>
                    )}
                  </button>
                  
                  <p className="text-[10px] sm:text-[11px] text-white/60 text-center font-medium">
                    ⚡ Instant automated verification & receipt. No manual screenshot needed when paid via Cashfree.
                  </p>
                </div>
              </div>
            </motion.div>

          </motion.div>
        )}

        {/* -------------------- TAB 2: PROFILE -------------------- */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-white p-4 sm:p-6 lg:p-8">
              <h3 className="font-black text-xl sm:text-2xl text-[#0f172a] mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
                <User size={20} className="sm:w-6 sm:h-6 text-[#3b82f6]" /> Student Profile
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-8 sm:gap-x-12">
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Full Name</p>
                    <p className="font-black text-base sm:text-lg text-[#1e293b]">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Father's Name</p>
                    <p className="font-bold text-sm sm:text-base text-[#1e293b]">{student.fatherName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Mother's Name</p>
                    <p className="font-bold text-sm sm:text-base text-[#1e293b]">{student.motherName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Course/Class</p>
                    <p className="font-bold text-sm sm:text-base text-[#1e293b]">{student.course}</p>
                  </div>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Mobile</p>
                    <p className="font-black text-base sm:text-lg text-[#1e293b]">{student.mobile}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Email Address</p>
                    <p className="font-bold text-sm sm:text-base text-[#1e293b] flex items-center gap-2">
                      <Mail size={14} className="sm:w-4 sm:h-4 text-[#64748b]" /> {student.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Joining Date</p>
                    <p className="font-bold text-sm sm:text-base text-[#1e293b] flex items-center gap-2">
                      <Calendar size={14} className="sm:w-4 sm:h-4 text-[#64748b]" /> {formatJoiningDate(student.joiningDate || student.admissionDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Registered Address</p>
                    <p className="font-bold text-sm sm:text-base text-[#1e293b] flex items-start gap-2">
                      <MapPin size={14} className="sm:w-4 sm:h-4 text-[#64748b] mt-0.5 flex-shrink-0" /> {student.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aadhaar Details Section */}
              {(student.aadharNumber || student.aadharFront || student.aadharBack) && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-100">
                  <h4 className="font-bold text-base sm:text-lg text-[#0f172a] mb-4 sm:mb-6 flex items-center gap-2">
                    <ShieldCheck size={18} className="sm:w-5 sm:h-5 text-[#3b82f6]" /> KYC Details
                  </h4>
                  
                  {student.aadharNumber && (
                    <div className="mb-4 sm:mb-6">
                      <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-1">Aadhaar Number</p>
                      <p className="font-black text-base sm:text-lg text-[#1e293b] tracking-widest">{student.aadharNumber}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {student.aadharFront && (
                      <div className="flex-1">
                        <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-2">Aadhaar Front</p>
                        <img 
                          src={student.aadharFront} 
                          alt="Aadhaar Front" 
                          className="w-full max-w-sm rounded-lg sm:rounded-xl border-2 border-slate-200 shadow-sm object-cover" 
                        />
                      </div>
                    )}
                    {student.aadharBack && (
                      <div className="flex-1">
                        <p className="text-[10px] sm:text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest mb-2">Aadhaar Back</p>
                        <img 
                          src={student.aadharBack} 
                          alt="Aadhaar Back" 
                          className="w-full max-w-sm rounded-lg sm:rounded-xl border-2 border-slate-200 shadow-sm object-cover" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* -------------------- TAB 3: PAYMENTS -------------------- */}
        {activeTab === 'payments' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-white p-4 sm:p-6 lg:p-8">
              <h3 className="font-black text-xl sm:text-2xl text-[#0f172a] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
                <Receipt size={20} className="sm:w-6 sm:h-6 text-[#16a34a]" /> Payment History & Receipts
              </h3>

              {paymentHistory.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-[#64748b] space-y-4">
                  <Receipt size={48} className="sm:w-14 sm:h-14 mx-auto text-slate-300" />
                  <p className="font-bold text-base sm:text-lg">No payment history found</p>
                  <p className="text-xs sm:text-sm text-[#94a3b8]">Fee receipts will appear here once recorded by the admin.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout (visible below sm breakpoint) */}
                  <div className="sm:hidden space-y-3">
                    {paymentHistory.map((fee: any) => (
                      <div key={fee._id} className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {fee.receiptNumber || 'MIGRATED'}
                          </span>
                          <span className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-bold border border-slate-200 text-[10px] capitalize">
                            {fee.paymentMode || 'cash'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wide">Date</p>
                            <p className="font-medium text-[#1e293b]">{new Date(fee.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wide">Month</p>
                            <p className="font-bold text-[#1e293b]">{fee.month}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <p className="font-black text-lg text-[#0f172a]">{formatRupee(fee.amount || 0)}</p>
                          <button
                            onClick={() => handleDownloadReceipt(fee)}
                            className="p-2 text-[#3b82f6] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download Receipt"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table Layout (visible on sm and above) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[#64748b] border-b-2 border-slate-100">
                          <th className="font-bold uppercase tracking-wider text-[11px] pb-4 px-2">Receipt No</th>
                          <th className="font-bold uppercase tracking-wider text-[11px] pb-4 px-2">Payment Date</th>
                          <th className="font-bold uppercase tracking-wider text-[11px] pb-4 px-2">Month</th>
                          <th className="font-bold uppercase tracking-wider text-[11px] pb-4 px-2">Mode</th>
                          <th className="font-bold uppercase tracking-wider text-[11px] pb-4 px-2 text-right">Amount</th>
                          <th className="font-bold uppercase tracking-wider text-[11px] pb-4 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((fee: any) => (
                          <tr key={fee._id} className="text-[#1e293b] hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-2">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                {fee.receiptNumber || 'MIGRATED'}
                              </span>
                            </td>
                            <td className="py-4 px-2 font-medium text-[#64748b]">
                              {new Date(fee.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-2 font-bold">{fee.month}</td>
                            <td className="py-4 px-2 capitalize text-xs">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-bold border border-slate-200">
                                {fee.paymentMode || 'cash'}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-right font-black text-lg text-[#0f172a]">
                              {formatRupee(fee.amount || 0)}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button
                                onClick={() => handleDownloadReceipt(fee)}
                                className="p-1.5 text-[#3b82f6] hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download Receipt"
                              >
                                <Download size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* -------------------- TAB 4: COURSES -------------------- */}
        {activeTab === 'courses' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-white p-4 sm:p-6 lg:p-8">
              <h3 className="font-black text-xl sm:text-2xl text-[#0f172a] mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
                <BookOpen size={20} className="sm:w-6 sm:h-6 text-[#3b82f6]" /> Enrolled Courses
              </h3>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Monitor size={32} />
                 </div>
                 <div>
                    <h4 className="text-lg font-bold text-slate-800">{student.course || "No specific course"}</h4>
                    <p className="text-sm text-slate-500 mt-1">Status: <span className="text-green-600 font-semibold uppercase">{student.status}</span></p>
                    <p className="text-sm text-slate-500 mt-1">Joined: {formatJoiningDate(student.admissionDate || student.joiningDate)}</p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* -------------------- TAB 5: FEEDBACK -------------------- */}
        {activeTab === 'feedback' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-white p-4 sm:p-6 lg:p-8">
              <h3 className="font-black text-xl sm:text-2xl text-[#0f172a] mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
                <MessageSquare size={20} className="sm:w-6 sm:h-6 text-[#3b82f6]" /> Student Feedback
              </h3>
              
              <div className="max-w-2xl">
                <p className="text-sm text-slate-600 mb-6">We value your feedback! Share your suggestions, complaints, or ideas to help us improve Galaxy.</p>
                <textarea 
                  className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 resize-none bg-white/50"
                  placeholder="Type your feedback here..."
                  id="feedback-text"
                ></textarea>
                <button 
                  onClick={() => {
                    const text = (document.getElementById('feedback-text') as HTMLTextAreaElement).value;
                    if(!text) return alert('Please write some feedback first.');
                    window.open(`https://wa.me/917488252019?text=${encodeURIComponent(`*Student Feedback*\nName: ${student.name}\nID: ${student.studentId}\nFeedback: ${text}`)}`, '_blank');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md"
                >
                  <Send size={18} /> Submit Feedback
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* -------------------- TAB 6: ADMISSION REQUEST -------------------- */}
        {activeTab === 'admission' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
            <AdmissionRequestForm />
          </motion.div>
        )}

        {/* -------------------- TAB 7: CERTIFICATE -------------------- */}
        {activeTab === 'certificate' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
            <CertificateTab student={student} onUpdateStudent={(updated) => setData((prev: any) => ({ ...prev, student: updated }))} />
          </motion.div>
        )}

      </main>
      <ChatBot />
    </div>
  );
}
