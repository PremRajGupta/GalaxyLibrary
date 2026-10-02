import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, CreditCard, Check } from 'lucide-react';
import type { PaymentReceipt } from './receiptService';
import { generateReceiptPDF, getDefaultReceiptLogo } from './receiptService';
import { getInitials, getAvatarColor } from './feeModels';
import { formatJoiningDate } from '../../lib/formatDate';
import { feeApi, studentApi } from '../../lib/apiService';

interface ReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentReceipt | null;
  title?: string;
  subtitle?: string;
  studentPhoto?: string;
  onDownloaded?: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  isOpen,
  onClose,
  payment,
  title = 'Payment Successful!',
  subtitle = 'Fee collection completed successfully',
  studentPhoto,
  onDownloaded,
}) => {
  const [receiptFeeDetails, setReceiptFeeDetails] = useState<any>(null);
  const [loadingFeeDetails, setLoadingFeeDetails] = useState(false);
  const [resolvedPhoto, setResolvedPhoto] = useState<string | undefined>(studentPhoto);
  const [resolvedCourse, setResolvedCourse] = useState<string>('');
  const [resolvedSeat, setResolvedSeat] = useState<string>('');
  const [resolvedFather, setResolvedFather] = useState<string>('');
  const [resolvedJoiningDate, setResolvedJoiningDate] = useState<string>('');
  const [resolvedMobile, setResolvedMobile] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !payment) {
      setReceiptFeeDetails(null);
      return;
    }

    // Try to resolve student details from cached students if missing on receipt
    const cachedStudents = studentApi.getCachedStudents?.() || [];
    const matchedStudent = cachedStudents.find(
      (s: any) =>
        (s.studentId && s.studentId === payment.studentId) ||
        (s._id && s._id === payment.studentId)
    );

    setResolvedPhoto(studentPhoto || matchedStudent?.photo);
    setResolvedCourse(payment.course || matchedStudent?.course || 'General');
    setResolvedSeat(payment.seatNumber || matchedStudent?.seatNumber || matchedStudent?.seat || '--');
    setResolvedFather(payment.fatherName || matchedStudent?.fatherName || matchedStudent?.father || 'N/A');
    setResolvedJoiningDate(payment.joiningDate || matchedStudent?.joiningDate || matchedStudent?.admissionDate || payment.date);
    setResolvedMobile(payment.studentMobile || matchedStudent?.mobile || matchedStudent?.contact || 'N/A');

    // Fetch validity details
    let isCurrent = true;
    const fetchValidity = async () => {
      try {
        setLoadingFeeDetails(true);
        const validity = await feeApi.getStudentPaymentValidity(payment.studentId);
        if (isCurrent) {
          setReceiptFeeDetails(validity);
        }
      } catch (err) {
        console.error('Failed to fetch payment validity:', err);
        if (isCurrent) setReceiptFeeDetails(null);
      } finally {
        if (isCurrent) setLoadingFeeDetails(false);
      }
    };

    fetchValidity();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, payment, studentPhoto]);

  if (!isOpen || !payment) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await generateReceiptPDF(payment, getDefaultReceiptLogo());
      if (onDownloaded) onDownloaded();
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
      alert('Failed to download receipt PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const discount = payment.discountAmount || 0;
  const finalPayment = payment.amount - discount;

  const renderStudentAvatar = (name: string, photo?: string) => {
    if (photo) {
      return (
        <img
          src={photo}
          alt={name}
          className="w-16 h-16 mx-auto rounded-[14px] object-cover shadow-md flex-shrink-0"
        />
      );
    }
    return (
      <div
        className={`w-16 h-16 mx-auto rounded-[14px] ${getAvatarColor(
          name
        )} flex items-center justify-center flex-shrink-0 shadow-md`}
      >
        <span className="text-white font-semibold text-xl">{getInitials(name)}</span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-[#e2e8f0]/80 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] px-6 sm:px-8 py-5 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h2>
                <p className="text-green-100 text-xs sm:text-sm mt-0.5">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Close"
            >
              <X size={22} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Column: Student Card & Receipt ID Card */}
              <div className="md:col-span-1 space-y-4">
                {/* Student Card */}
                <div className="bg-[#f8fafc] rounded-[18px] p-4 text-center border border-[#e2e8f0]">
                  {renderStudentAvatar(payment.studentName, resolvedPhoto)}
                  <h3 className="text-base font-bold text-[#1e293b] mt-3 truncate" title={payment.studentName}>
                    {payment.studentName}
                  </h3>
                  <p className="text-xs text-[#64748b] font-medium">{payment.studentId}</p>
                  <div className="mt-3 bg-white rounded-[10px] p-2 border border-[#e2e8f0]">
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">Course</p>
                    <p className="text-xs font-bold text-[#1e293b] truncate" title={resolvedCourse}>
                      {resolvedCourse}
                    </p>
                  </div>
                </div>

                {/* Receipt ID Card */}
                <div className="bg-gradient-to-br from-[#2F4FD7] to-[#1e40af] rounded-[18px] p-4 text-white shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">RECEIPT ID</p>
                  <p className="text-lg sm:text-xl font-mono font-bold mt-0.5 mb-3 break-all">{payment.id}</p>
                  <div className="space-y-1.5 text-xs border-t border-white/20 pt-2.5">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Date:</span>
                      <span className="font-semibold">{payment.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Time:</span>
                      <span className="font-semibold">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Details */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white rounded-[18px] p-5 border border-[#e2e8f0] shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-[#1e293b]">Payment Details</h3>

                  {/* Amount Paid */}
                  <div className="flex items-center justify-between p-3.5 bg-[#f8fafc] rounded-[12px] border border-[#f1f5f9]">
                    <span className="text-xs sm:text-sm font-semibold text-[#64748b]">Amount Paid</span>
                    <span className="text-xl sm:text-2xl font-bold text-[#22c55e]">
                      ₹{payment.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Discount & Final Payment */}
                  {discount > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-[#fff7ed] rounded-[12px] border border-[#fed7aa]">
                        <span className="text-xs font-semibold text-[#9a3412]">Discount</span>
                        <span className="text-base font-bold text-[#ea580c]">
                          ₹{discount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#eff6ff] rounded-[12px] border border-[#bfdbfe]">
                        <span className="text-xs font-semibold text-[#1e3a8a]">Final Payment</span>
                        <span className="text-base font-bold text-[#2F4FD7]">
                          ₹{finalPayment.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9]">
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">For Period</p>
                      <p className="text-xs font-bold text-[#1e293b] mt-0.5">{payment.month || '-'}</p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9]">
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">Payment Mode</p>
                      <p className="text-xs font-bold text-[#2F4FD7] mt-0.5 uppercase">
                        {payment.paymentMode || 'CASH'}
                      </p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9]">
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">Seat Number</p>
                      <p className="text-xs font-bold text-[#1e293b] mt-0.5">{resolvedSeat}</p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9]">
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">Joining Date</p>
                      <p className="text-xs font-bold text-[#1e293b] mt-0.5">{formatJoiningDate(resolvedJoiningDate)}</p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9] col-span-2">
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">Father Name</p>
                      <p className="text-xs font-bold text-[#1e293b] mt-0.5">{resolvedFather}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {payment.notes && (
                    <div className="p-3.5 bg-[#eff6ff] rounded-[12px] border border-[#bfdbfe]">
                      <p className="text-[10px] font-semibold text-[#1e40af] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-xs text-[#1e40af] leading-relaxed">{payment.notes}</p>
                    </div>
                  )}

                  {/* Payment Validity Section */}
                  {loadingFeeDetails ? (
                    <div className="p-3.5 bg-[#f8fafc] rounded-[12px] animate-pulse border border-[#f1f5f9]">
                      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">Payment Validity</p>
                      <p className="text-xs text-[#64748b] mt-1">Loading validity data...</p>
                    </div>
                  ) : receiptFeeDetails?.validUntilDate ? (
                    <div className="p-3.5 bg-gradient-to-br from-[#fef08a]/60 to-[#fef3c7] rounded-[12px] border border-[#fcd34d]">
                      <p className="text-[10px] font-semibold text-[#92400e] uppercase tracking-wider mb-2">
                        Payment Validity
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#1e293b] font-medium">Months Covered:</span>
                          <span className="px-2 py-0.5 bg-[#92400e] text-white text-[11px] font-bold rounded">
                            {receiptFeeDetails.monthsCovered || 0} months
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#1e293b] font-medium">Validity Period:</span>
                          <span className="font-bold text-[#1e293b]">
                            {formatJoiningDate(resolvedJoiningDate)} to {formatJoiningDate(receiptFeeDetails.validUntilDate)}
                          </span>
                        </div>
                        {receiptFeeDetails.advanceMonths > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#1e293b] font-medium">Advance Balance:</span>
                            <span className="font-bold text-[#166534]">
                              {receiptFeeDetails.advanceMonths} months paid ahead
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1.5 border-t border-[#fcd34d]/60">
                          <span className="text-[#1e293b] font-medium">Status:</span>
                          {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const validUntil = new Date(receiptFeeDetails.validUntilDate);
                            validUntil.setHours(0, 0, 0, 0);
                            const daysRemaining =
                              receiptFeeDetails.rawDaysRemaining ??
                              Math.floor((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            if (daysRemaining < 0) {
                              return (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded border border-red-300">
                                  Expired on {formatJoiningDate(receiptFeeDetails.validUntilDate)}
                                </span>
                              );
                            } else if (daysRemaining <= 15) {
                              return (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded border border-yellow-300">
                                  Expiring soon: {daysRemaining} days left
                                </span>
                              );
                            } else {
                              return (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded border border-green-300">
                                  Valid until {formatJoiningDate(receiptFeeDetails.validUntilDate)}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Contact Info */}
                  <div className="p-2.5 bg-[#f8fafc] rounded-[10px] border border-[#f1f5f9] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#64748b]">Mobile Contact:</span>
                    <span className="font-bold text-[#1e293b]">{resolvedMobile}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="py-3 px-4 bg-[#2F4FD7] hover:bg-[#1e40af] text-white font-bold rounded-[12px] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <CreditCard size={16} />
                <span>{downloading ? 'Downloading...' : 'Download Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold rounded-[12px] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Check size={16} />
                <span>Done</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiptDetailModal;
