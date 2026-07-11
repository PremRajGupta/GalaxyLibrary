import { useState, useEffect, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import {
  OTHER_TIME_SHIFT,
  TIME_SHIFT_OPTIONS,
  getFeeForTimeShift,
  isPresetTimeShift,
} from '../../lib/feeRules';
import { toDateInputValue } from '../../lib/formatDate';
import { COURSE_OPTIONS } from '../../lib/courseOptions';
import { seatApi, studentApi, requestApi } from '../../lib/apiService';
import { generateAllSeatNumbers, getAvailableSeatsFromStudents } from '../../lib/seatLayout';
import { normalizeIndianMobile, validateIndianMobile } from '../../lib/phoneValidation';
import { useAuth } from '../../context/AuthContext';

const RUPEE = '\u20B9';
const formatRupee = (amount: number) => `${RUPEE}${amount.toLocaleString('en-IN')}`;
const RequiredMark = () => <span className="text-red-600"> *</span>;

export default function AdmissionRequestForm() {
  const { user: loggedInUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    parentMobile: '',
    email: '',
    address: '',
    course: '',
    customCourse: '',
    seatNumber: '',
    customSeat: '',
    timeShift: '',
    customShiftHours: '',
    joiningDate: toDateInputValue(),
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(true);
  const [seatSearch, setSeatSearch] = useState('');
  const [seatDropdownOpen, setSeatDropdownOpen] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const seatDropdownRef = useRef<HTMLDivElement>(null);

  const loadAvailableSeats = async () => {
    setSeatsLoading(true);
    try {
      const data = await seatApi.getAvailableSeats();
      if (Array.isArray(data?.seats)) {
        setAvailableSeats(data.seats);
        setSeatsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Failed to load available seats from API:', error);
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

  useEffect(() => {
    loadAvailableSeats();
  }, [submitted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seatDropdownRef.current && !seatDropdownRef.current.contains(event.target as Node)) {
        setSeatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'mobile' || name === 'parentMobile') {
      setFormData((prev) => ({ ...prev, [name]: normalizeIndianMobile(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSeatSelect = (seat: string) => {
    if (seat === 'other') {
      setFormData(prev => ({ ...prev, seatNumber: 'other', customSeat: '' }));
    } else {
      setFormData(prev => ({ ...prev, seatNumber: seat, customSeat: '' }));
    }
    setSeatDropdownOpen(false);
  };

  const expectedFee = isPresetTimeShift(formData.timeShift) 
    ? getFeeForTimeShift(formData.timeShift) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const mobileError = validateIndianMobile(formData.mobile);
    if (mobileError) {
      setErrorMessage(mobileError);
      setIsSubmitting(false);
      return;
    }
    
    const isParentMobileRequired = formData.timeShift === '24hours' || formData.timeShift === 'night';
    if (isParentMobileRequired && !formData.parentMobile) {
      setErrorMessage('Parent Mobile Number is required for 24 hours or night shift.');
      setIsSubmitting(false);
      return;
    }

    if (formData.parentMobile) {
      const parentMobileError = validateIndianMobile(formData.parentMobile);
      if (parentMobileError) {
        setErrorMessage(parentMobileError);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const requestPayload = {
        studentId: loggedInUser?.studentId,
        requestType: 'admission',
        details: `Referral admission for ${formData.name}`,
        admissionData: {
          ...formData,
          feeAmount: expectedFee.toString(),
          paymentMode: 'cash', // default
        }
      };

      await requestApi.createRequest(requestPayload);
      
      setSubmitted(true);
      setSuccessMessage('Admission request submitted successfully! It is pending admin approval.');
      setFormData({
        name: '',
        fatherName: '',
        motherName: '',
        mobile: '',
        parentMobile: '',
        email: '',
        address: '',
        course: '',
        customCourse: '',
        seatNumber: '',
        customSeat: '',
        timeShift: '',
        customShiftHours: '',
        joiningDate: toDateInputValue(),
      });
      setTimeout(() => {
        if (successRef.current) {
          successRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit admission request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSeats = availableSeats.filter(seat => 
    seat.toLowerCase().includes(seatSearch.toLowerCase())
  );

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-white p-4 sm:p-6 lg:p-8">
      <h3 className="font-black text-xl sm:text-2xl text-[#0f172a] mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
        <UserPlus size={20} className="sm:w-6 sm:h-6 text-[#3b82f6]" /> Refer for Admission
      </h3>
      <p className="text-sm text-slate-600 mb-6">Submit an admission request for a friend. The admin will review and complete the admission process.</p>
      
      {successMessage && (
        <div ref={successRef} className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-start gap-3">
          <div className="mt-0.5">
             <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>
          </div>
          <div>
            <h4 className="font-bold text-sm">Success!</h4>
            <p className="text-sm mt-1">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage('')}
              className="text-xs font-semibold mt-2 underline opacity-80 hover:opacity-100 transition-opacity"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium text-sm">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Student Name<RequiredMark/></label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
              placeholder="Enter student name"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Father's Name<RequiredMark/></label>
            <input
              type="text"
              name="fatherName"
              required
              value={formData.fatherName}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
              placeholder="Enter father's name"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Mother's Name<RequiredMark/></label>
            <input
              type="text"
              name="motherName"
              required
              value={formData.motherName}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
              placeholder="Enter mother's name"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Mobile Number<RequiredMark/></label>
            <input
              type="tel"
              name="mobile"
              required
              value={formData.mobile}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
              Parent Mobile Number{(formData.timeShift === '24hours' || formData.timeShift === 'night') && <RequiredMark/>}
            </label>
            <input
              type="tel"
              name="parentMobile"
              required={formData.timeShift === '24hours' || formData.timeShift === 'night'}
              value={formData.parentMobile}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
              placeholder="10-digit parent mobile"
              maxLength={10}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Email<RequiredMark/></label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
              placeholder="Enter email address"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Address<RequiredMark/></label>
            <textarea
              name="address"
              required
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base resize-none"
              placeholder="Enter full address"
            ></textarea>
          </div>
        </div>

        {/* Course, Seat, Date Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Course/Class<RequiredMark/></label>
            <select
              name="course"
              required
              value={formData.course}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
            >
              <option value="">Select course</option>
              {COURSE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {formData.course === 'other' && (
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Custom Course Details<RequiredMark/></label>
              <input
                type="text"
                name="customCourse"
                required
                value={formData.customCourse}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
                placeholder="Enter custom course name"
              />
            </div>
          )}

          <div className="col-span-1" ref={seatDropdownRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Seat Number<RequiredMark/></label>
            <div className="relative">
              <input
                type="text"
                readOnly
                required
                value={formData.seatNumber === 'other' ? 'Other (custom seat)' : formData.seatNumber}
                onClick={() => setSeatDropdownOpen(!seatDropdownOpen)}
                placeholder={seatsLoading ? "Loading seats..." : "Choose Seat"}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white cursor-pointer text-sm sm:text-base"
              />
              {seatDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Search seat..."
                      value={seatSearch}
                      onChange={(e) => setSeatSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="overflow-y-auto overflow-x-hidden flex-1">
                    {filteredSeats.length > 0 ? (
                      filteredSeats.map(seat => (
                        <div
                          key={seat}
                          onClick={() => handleSeatSelect(seat)}
                          className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer text-slate-700"
                        >
                          {seat}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">No seats found</div>
                    )}
                    <div
                      onClick={() => handleSeatSelect('other')}
                      className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer text-slate-700 border-t border-slate-100"
                    >
                      Other (custom seat)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {formData.seatNumber === 'other' && (
             <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Custom Seat Reference<RequiredMark/></label>
                <input
                  type="text"
                  name="customSeat"
                  required
                  value={formData.customSeat}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
                  placeholder="e.g. Temp Seat"
                />
             </div>
          )}

          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Time Shift<RequiredMark/></label>
            <select
              name="timeShift"
              required
              value={formData.timeShift}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
            >
              <option value="">Select shift</option>
              {TIME_SHIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {formData.timeShift === OTHER_TIME_SHIFT && (
             <div className="col-span-1 md:col-span-2">
               <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Custom Shift Duration (Hours)<RequiredMark/></label>
               <input
                  type="number"
                  name="customShiftHours"
                  required
                  min="1"
                  max="24"
                  value={formData.customShiftHours}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
                  placeholder="Enter number of hours"
               />
             </div>
          )}

          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Joining Date<RequiredMark/></label>
            <input
              type="date"
              name="joiningDate"
              required
              value={formData.joiningDate}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
            />
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Expected Fee (Info only)</label>
            <div className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-medium text-sm sm:text-base">
              {expectedFee > 0 ? formatRupee(expectedFee) : 'Based on shift'}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting Request...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
