import React, { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import { requestApi } from '../lib/apiService';
import LiveSelfieCapture from '../components/camera/LiveSelfieCapture';
import ImageCaptureField from '../components/ImageCaptureField';
import { CreditCard, ShieldCheck, Fingerprint, Camera, FileCheck, CheckCircle } from 'lucide-react';
import AppLogo from '../components/AppLogo';
import { TIME_SHIFT_OPTIONS, getFeeForTimeShift, isPresetTimeShift, OTHER_TIME_SHIFT } from '../lib/feeRules';
import { COURSE_OPTIONS } from '../lib/courseOptions';
import { studentApi } from '../lib/apiService';
import { generateAllSeatNumbers, getAvailableSeatsFromStudents } from '../lib/seatLayout';

import { loadSiteContent } from '../lib/siteContentService';

export default function PublicAdmission() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifiedOrderId, setVerifiedOrderId] = useState<string | null>(null);
  const [cashfreeInstance, setCashfreeInstance] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Dynamic Fees from Backend
  const [libraryFee, setLibraryFee] = useState(5);
  const [computerCenterFee, setComputerCenterFee] = useState(50);
  
  React.useEffect(() => {
    loadSiteContent().then(({ content }) => {
      if (content.admissionFees) {
        setLibraryFee(content.admissionFees.library);
        setComputerCenterFee(content.admissionFees.computerCenter);
      }
    }).catch(err => console.error('Failed to load admission fees', err));

    // Preload Cashfree SDK to eliminate button click delay
    load({ mode: 'production' })
      .then(cf => setCashfreeInstance(cf))
      .catch(err => console.warn('Cashfree preload error:', err));

    // Handle return from Cashfree payment redirect with server verification
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    if (orderId) {
      setLoading(true);
      requestApi.getCashfreeOrderStatus(orderId)
        .then(res => {
          if (res.order_status === 'PAID') {
            setVerifiedOrderId(orderId);
            setStep(2);
          } else {
            setStep(1);
            setVerifiedOrderId(null);
            setError('Payment complete nahi hui hai (Aapne payment cancel kar diya ya chhod diya). Kripya naye sire se pay karein.');
          }
        })
        .catch(() => {
          setStep(1);
          setError('Payment status verify nahi ho saka. Kripya punah prayas karein.');
        })
        .finally(() => {
          setLoading(false);
          // Remove ?order_id=... from browser address bar so refresh stays clean on Step 1
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, []);

  // Form State
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarData] = useState<any>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);

  const [tenthCert, setTenthCert] = useState<string | null>(null);
  const [twelfthCert, setTwelfthCert] = useState<string | null>(null);
  const [gradCert, setGradCert] = useState<string | null>(null);
  const [aadharFront, setAadharFront] = useState<string | null>(null);
  const [aadharBack, setAadharBack] = useState<string | null>(null);

  // Registration Type & Detailed Fee Breakdown
  const [registrationType, setRegistrationType] = useState<'library' | 'computer_center'>('library');
  const baseRegistrationFee = registrationType === 'library' ? libraryFee : computerCenterFee;
  const convenienceFee = 1.50; // Online payment gateway processing charge
  const totalPayableAmount = Number((baseRegistrationFee + convenienceFee).toFixed(2));

  // Admission Data
  const [course, setCourse] = useState('');
  const [customCourse, setCustomCourse] = useState('');
  const [shift, setShift] = useState('');
  const [customShiftHours, setCustomShiftHours] = useState('');
  
  // New Detailed Form State
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [seatNumber, setSeatNumber] = useState('');
  const [address, setAddress] = useState('');

  // Seat Selection State
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [seatSearch, setSeatSearch] = useState('');
  const [seatDropdownOpen, setSeatDropdownOpen] = useState(false);
  const seatDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (step === 4) {
      loadAvailableSeats();
    }
  }, [step]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seatDropdownRef.current && !seatDropdownRef.current.contains(event.target as Node)) {
        setSeatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAvailableSeats = async () => {
    setSeatsLoading(true);
    try {
      const data = await requestApi.getPublicAvailableSeats();
      if (Array.isArray(data?.seats)) {
        setAvailableSeats(data.seats);
        setSeatsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to load available seats from public API:', error);
    }

    try {
      const students = await studentApi.getStudents();
      setAvailableSeats(getAvailableSeatsFromStudents(students));
    } catch (error) {
      console.error('Failed to derive available seats from students:', error);
      setAvailableSeats(generateAllSeatNumbers());
    } finally {
      setSeatsLoading(false);
    }
  };

  const handleSeatSearchChange = (value: string) => {
    setSeatSearch(value);
    setSeatDropdownOpen(true);
    const exactMatch = availableSeats.find(
      (seat) => seat.toLowerCase() === value.trim().toLowerCase(),
    );
    if (exactMatch) {
      setSeatNumber(exactMatch);
      return;
    }
    if (seatNumber && seatNumber !== value) {
      setSeatNumber('');
    }
  };

  const selectSeat = (seat: string) => {
    setSeatNumber(seat);
    setSeatSearch(seat);
    setSeatDropdownOpen(false);
  };

  const seatSearchQuery = seatSearch.trim().toLowerCase();
  const filteredSeats = availableSeats.filter(
    (seat) => !seatSearchQuery || seat.toLowerCase().includes(seatSearchQuery),
  );

  // Step 1: Initialize Payment
  const handlePayment = async () => {
    if (!phone || phone.trim().length !== 10) {
      setError('Kripya 10 anko ka valid mobile number enter karein (Please enter valid 10-digit mobile number)');
      return;
    }
    if (!name || !name.trim()) {
      setError('Kripya student ka poora naam enter karein (Please enter student full name)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      setError('Kripya valid email address enter karein (e.g. student@gmail.com)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await requestApi.createCashfreeOrder(phone, name.trim(), totalPayableAmount, email.trim());
      const { orderId, paymentSessionId, environment } = data;
      
      const cashfreeMode = (environment === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox';
      const cashfree = cashfreeInstance || await load({
        mode: cashfreeMode
      });
      
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: "_modal" as const,
      };

      await cashfree.checkout(checkoutOptions);
      
      // Modal closed or user finished payment — Verify actual payment status with server!
      setVerifyingPayment(true);
      try {
        const statusRes = await requestApi.getCashfreeOrderStatus(orderId);
        if (statusRes.order_status === 'PAID') {
          setVerifiedOrderId(orderId);
          setError('');
          setStep(2);
        } else {
          setStep(1);
          setVerifiedOrderId(null);
          setError('Payment poori nahi hui hai (Aapne payment chhod di ya cancel kar di). Admission form aage bharne ke liye payment complete hona anivarya hai.');
        }
      } catch (vErr) {
        console.error('Payment verification error:', vErr);
        setStep(1);
        setVerifiedOrderId(null);
        setError('Payment verify nahi ho saki. Agar aapke bank se paise kate hain toh kripya thoda wait karein.');
      } finally {
        setVerifyingPayment(false);
      }
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // Step 4: Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedOrderId) {
      setError('Bina payment kiye admission form jama nahi kiya ja sakta. Kripya pehle payment karein.');
      setStep(1);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const admissionData = {
        orderId: verifiedOrderId,
        name: aadhaarData?.name || name,
        mobile: phone,
        registrationType,
        aadhaarNumber: aadhaarNumber,
        course,
        customCourse: course === 'other' ? customCourse : '',
        shift,
        customShiftHours: shift === OTHER_TIME_SHIFT ? customShiftHours : '',
        address: address,
        dob: aadhaarData?.dob,
        gender: aadhaarData?.gender,
        livePhotoBase64: livePhoto,
        fatherName,
        motherName,
        parentMobile,
        email,
        joiningDate,
        seatNumber,
        aadharFront,
        aadharBack,
        tenthCert,
        twelfthCert,
        gradCert,
        feeBreakdown: {
          baseRegistrationFee,
          convenienceFee,
          totalPaidAmount: totalPayableAmount
        }
      };

      await requestApi.submitPublicAdmission(admissionData);
      setStep(5);
    } catch (err: any) {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-20 flex items-center justify-between">
          <AppLogo size="lg" showName={true} />
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online Admission Open
            </span>
            <div className="text-sm font-semibold text-slate-500 hidden sm:block">
              Online Admission Portal
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-8">
        
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            ></div>

            {[
              { id: 1, icon: CreditCard, label: 'Payment' },
              { id: 2, icon: Fingerprint, label: 'KYC' },
              { id: 3, icon: Camera, label: 'Selfie' },
              { id: 4, icon: FileCheck, label: 'Review' },
              { id: 5, icon: CheckCircle, label: 'Done' }
            ].map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= s.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  <s.icon size={22} strokeWidth={step >= s.id ? 2.5 : 2} />
                </div>
                <span className={`text-xs font-semibold ${step >= s.id ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 md:p-10 border border-slate-100 relative overflow-hidden">

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-3">
              <span className="font-semibold text-sm">{error}</span>
            </div>
          )}

          {/* STEP 1: PAYMENT */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Secure Admission Registration</h2>
                <p className="text-slate-500 mt-2">Pay a nominal fee of ₹{libraryFee} (Library) or ₹{computerCenterFee} (Computer Center) to start your KYC process.</p>
              </div>

              <div className="space-y-5 max-w-xl mx-auto">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Mobile Number (For Updates) <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs font-medium ${phone.length === 10 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {phone.length}/10 digits
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 focus:bg-white outline-none transition-all ${
                      phone.length === 10 ? 'border-emerald-500 focus:border-emerald-600' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {phone.length > 0 && phone.length < 10 && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      Kripya 10 anko ka mobile number dalein ({10 - phone.length} ank baki)
                    </p>
                  )}
                  {phone.length === 10 && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                      ✓ Valid mobile number
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter student's full name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. student@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Registration Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRegistrationType('library')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        registrationType === 'library' 
                          ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' 
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <h4 className={`font-bold ${registrationType === 'library' ? 'text-indigo-900' : 'text-slate-700'}`}>Library</h4>
                      <p className={`text-sm mt-1 ${registrationType === 'library' ? 'text-indigo-600' : 'text-slate-500'}`}>₹{libraryFee} Registration Fee</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationType('computer_center')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        registrationType === 'computer_center' 
                          ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' 
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <h4 className={`font-bold ${registrationType === 'computer_center' ? 'text-indigo-900' : 'text-slate-700'}`}>Computer Center</h4>
                      <p className={`text-sm mt-1 ${registrationType === 'computer_center' ? 'text-indigo-600' : 'text-slate-500'}`}>₹{computerCenterFee} Registration Fee</p>
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-50/70 rounded-2xl p-6 mt-6 border border-indigo-100">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-200/60 mb-3">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Fee Details & Breakdown</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">100% Secure</span>
                  </div>

                  <div className="space-y-2.5 text-sm pb-4 border-b border-indigo-200/60">
                    {/* Line 1: Registration Fee */}
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium">Admission Registration Fee</span>
                        <span className="text-[11px] text-slate-500">({registrationType === 'library' ? 'Galaxy Library' : 'Galaxy Computer Center'})</span>
                      </div>
                      <span className="font-bold text-slate-800">₹{baseRegistrationFee.toFixed(2)}</span>
                    </div>

                    {/* Line 2: Convenience Fee */}
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 font-medium">Convenience Fee</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">PG Processing</span>
                        </div>
                        <span className="text-[11px] text-slate-500">Online payment processing charge</span>
                      </div>
                      <span className="font-bold text-slate-800">₹{convenienceFee.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Line 4: Final Total Amount */}
                  <div className="flex justify-between items-center py-4">
                    <div>
                      <span className="text-base font-bold text-indigo-950 block">Final Payable Amount</span>
                      <span className="text-xs text-indigo-600 font-medium">Total payable amount (All inclusive)</span>
                    </div>
                    <span className="text-2xl font-extrabold text-indigo-700">₹{totalPayableAmount.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading || verifyingPayment}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Connecting to Cashfree UPI...</span>
                      </>
                    ) : verifyingPayment ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Verifying Payment Status...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Pay ₹{totalPayableAmount.toFixed(2)} Securely</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-indigo-400/80 text-xs mt-3 font-medium flex items-center justify-center gap-1">
                    Powered by Cashfree Payments
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AADHAAR KYC */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Verify Identity</h2>
                <p className="text-slate-500 mt-2">Enter your 12-digit Aadhaar number to verify your identity.</p>
              </div>

              <div className="space-y-6 max-w-xl mx-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 text-center">Aadhaar Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="XXXX XXXX XXXX (12 Anko Ka Aadhaar)"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-lg tracking-widest font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 text-center mt-2">Agli screen par aapko Live Camera Selfie aur Aadhaar Card ka photo upload karna hoga.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (aadhaarNumber.length !== 12) {
                      setError('Kripya 12 anko ka valid Aadhaar number enter karein');
                      return;
                    }
                    setError('');
                    setStep(3);
                  }}
                  disabled={aadhaarNumber.length !== 12}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Aadhaar Verify & Live Selfie Ke Liye Aage Badhein</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE SELFIE */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Live Liveness Check</h2>
                <p className="text-slate-500 mt-2">Take a live selfie to verify your identity against Aadhaar.</p>
              </div>

              <div className="max-w-xl mx-auto">
                <LiveSelfieCapture 
                  onCapture={(imgData) => setLivePhoto(imgData)} 
                />

                {livePhoto && (
                  <div className="mt-8 pt-6 border-t border-slate-200 text-center animate-fade-in-up">
                    <p className="text-green-600 font-medium mb-4 flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Photo captured successfully!
                    </p>
                    <button
                      onClick={() => setStep(4)}
                      className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                      Continue to Form
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: FINAL FORM (Review & Submit) */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="animate-fade-in max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-800">Complete Admission Form</h2>
                <p className="text-slate-500 mt-2">Please verify and fill in the remaining details to complete your application.</p>
              </div>

              {/* Profile Photo (Selfie) */}
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 shadow-xl shadow-indigo-100/50 bg-white relative">
                  {livePhoto ? (
                    <img src={livePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                      <Camera size={40} />
                    </div>
                  )}
                  <div className="absolute bottom-0 w-full bg-green-500/90 text-white text-[10px] font-bold text-center py-1">
                    VERIFIED
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border-2 border-slate-100 mb-8 space-y-6">
                
                {/* Row 1: Student Name & Father's Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Student Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={aadhaarData?.name || name}
                      readOnly={!!aadhaarData?.name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 outline-none transition-all ${aadhaarData?.name ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-indigo-500'}`}
                    />
                    {aadhaarData?.name && <p className="text-xs text-green-600 mt-1 font-medium">✓ Verified from Aadhaar</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Father's Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={fatherName}
                      readOnly={!!aadhaarData?.care_of}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Enter father's name"
                      className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 outline-none transition-all ${aadhaarData?.care_of ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-indigo-500'}`}
                    />
                    {aadhaarData?.care_of && <p className="text-xs text-green-600 mt-1 font-medium">✓ Verified from Aadhaar</p>}
                  </div>
                </div>

                {/* Row 2: Mother's Name & Mobile Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mother's Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Enter mother's name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      readOnly
                      value={phone}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-100 text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 3: Joining Date & Parent Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Joining Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Mobile Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={parentMobile}
                      onChange={(e) => setParentMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit parent mobile"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Row 4: Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Row 5: Address */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    value={address}
                    readOnly={!!aadhaarData?.address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 outline-none transition-all resize-none ${aadhaarData?.address ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-indigo-500'}`}
                  ></textarea>
                  {aadhaarData?.address && <p className="text-xs text-green-600 mt-1 font-medium">✓ Verified from Aadhaar</p>}
                </div>

                {/* Row 6: Course & Seat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course/Class <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select course</option>
                      {COURSE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {course === 'other' && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Course <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={customCourse}
                          onChange={(e) => setCustomCourse(e.target.value)}
                          placeholder="Enter course name"
                          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={seatDropdownRef}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Seat Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={seatSearch}
                        onChange={(e) => handleSeatSearchChange(e.target.value)}
                        onFocus={() => setSeatDropdownOpen(true)}
                        placeholder="Choose Seat"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                      />
                      {seatsLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    {seatDropdownOpen && !seatsLoading && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredSeats.length > 0 ? (
                          filteredSeats.map((seat) => (
                            <button
                              key={seat}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-slate-700 focus:outline-none focus:bg-indigo-50 transition-colors"
                              onClick={() => selectSeat(seat)}
                            >
                              {seat}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            No matching available seats found.
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {availableSeats.length} seats available — type to search
                    </p>
                  </div>
                </div>

                {/* Row 7: Time Shift & Expected Fee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Time Shift <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select shift</option>
                      {TIME_SHIFT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {shift === OTHER_TIME_SHIFT && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Hours <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={customShiftHours}
                          onChange={(e) => {
                            if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                              setCustomShiftHours(e.target.value);
                            }
                          }}
                          placeholder="e.g. 10"
                          className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Fee Amount <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                      <input
                        type="text"
                        readOnly
                        value={isPresetTimeShift(shift) ? getFeeForTimeShift(shift) : (shift === OTHER_TIME_SHIFT ? 'Custom (TBD)' : 'Select time shift first')}
                        className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 border-slate-200 font-semibold outline-none cursor-not-allowed ${isPresetTimeShift(shift) ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Note: Paid amount will be updated by Admin upon full fee submission.</p>
                  </div>
                </div>
                
                {/* Aadhaar Details */}
                <div className="pt-6 border-t-2 border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4 text-lg">Aadhaar Card Details & Verification</h4>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Aadhaar Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      readOnly={!!aadhaarData?.name}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 font-medium outline-none ${aadhaarData?.name ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white focus:border-indigo-500'}`}
                    />
                    {aadhaarData?.name && <p className="text-xs text-green-600 mt-1 font-medium">✓ Verified from UIDAI Aadhaar</p>}
                  </div>

                  {/* Aadhaar Front & Back Photos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <ImageCaptureField
                      label={<span className="block text-sm font-semibold text-slate-700">Aadhaar Card (Front Photo) <span className="text-red-500">*</span></span>}
                      previewUrl={aadharFront}
                      onImageChange={setAadharFront}
                      facingMode="environment"
                      previewClassName="w-full h-36"
                      emptyHint="Aadhaar Front photo capture ya upload karein"
                      helperText="Front photo with student name & Aadhaar number clear hona chahiye."
                    />
                    <ImageCaptureField
                      label={<span className="block text-sm font-semibold text-slate-700">Aadhaar Card (Back Photo) <span className="text-red-500">*</span></span>}
                      previewUrl={aadharBack}
                      onImageChange={setAadharBack}
                      facingMode="environment"
                      previewClassName="w-full h-36"
                      emptyHint="Aadhaar Back photo capture ya upload karein"
                      helperText="Back side with full address clear hona chahiye."
                    />
                  </div>
                </div>

                {registrationType === 'computer_center' && (
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Educational Certificates <span className="text-sm font-normal text-slate-500">(Required for Computer Center)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ImageCaptureField
                        label={<span className="block text-sm font-semibold text-slate-700">10th Marksheet/Certificate <span className="text-red-500">*</span></span>}
                        previewUrl={tenthCert}
                        onImageChange={setTenthCert}
                        facingMode="environment"
                        previewClassName="w-full h-32"
                        emptyHint="Upload or capture 10th cert"
                        helperText="Ensure details are clear and readable."
                      />
                      <ImageCaptureField
                        label={<span className="block text-sm font-semibold text-slate-700">12th Marksheet (Optional)</span>}
                        previewUrl={twelfthCert}
                        onImageChange={setTwelfthCert}
                        facingMode="environment"
                        previewClassName="w-full h-32"
                        emptyHint="Upload or capture 12th cert"
                        helperText="If applicable."
                      />
                      <ImageCaptureField
                        label={<span className="block text-sm font-semibold text-slate-700">Graduation (Optional)</span>}
                        previewUrl={gradCert}
                        onImageChange={setGradCert}
                        facingMode="environment"
                        previewClassName="w-full h-32"
                        emptyHint="Upload or capture grad cert"
                        helperText="If applicable."
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 mt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={loading || (registrationType === 'computer_center' && !tenthCert)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Confirm & Submit Application'}
                  </button>
                </div>

              </div>
            </form>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 5 && (
            <div className="animate-fade-in text-center py-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Application Submitted!</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Your admission request has been successfully sent to the institute. Our team will verify your KYC details and approve your admission shortly.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-indigo-600 font-semibold hover:text-indigo-700 underline underline-offset-4"
              >
                Submit another application
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
