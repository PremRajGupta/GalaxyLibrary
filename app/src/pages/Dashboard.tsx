import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import QuickActionCard from '../components/QuickActionCard';
import { Users, Armchair, IndianRupee, AlertTriangle, ReceiptText } from 'lucide-react';
import { dashboardApi } from '../lib/apiService';
import { getTimeShiftLabel } from '../lib/feeRules';
import { getCourseLabel } from '../lib/courseOptions';

const quickActions = [
  { label: 'Admission', icon: '✍️', path: '/admission' },
  { label: 'Collect Fees', icon: '💰', path: '/fees' },
  { label: 'Assign Seat', icon: '🗺️', path: '/seat-map' },
  { label: 'Attendance', icon: '📅', path: '/students' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification] = useState('');
  const [registrationType, setRegistrationType] = useState('all');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats({ registrationType });
      setStatsData(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [location, registrationType]);

  const openFeesPayModal = (studentId: string) => {
    navigate('/fees', { state: { openPayForStudentId: studentId } });
  };

  if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

  const stats = [
    { label: 'Total Students', value: String(statsData?.totalStudents || 0), icon: Users, color: 'blue' as const },
    { label: 'Seats Occupied', value: String(statsData?.occupiedSeats || 0), icon: Armchair, color: 'green' as const },
    { label: 'Fees (This Month)', value: `₹${(statsData?.monthlyRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'yellow' as const },
    { label: 'Available Seats', value: String(statsData?.availableSeats || 0), icon: AlertTriangle, color: 'red' as const },
  ];
  const pendingFees = statsData?.pendingFees || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <div>
      <TopHeader />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-50 px-6 py-3 bg-[#22c55e] text-white text-sm font-medium rounded-lg shadow-lg"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex items-center justify-end">
        <select
          value={registrationType}
          onChange={(e) => setRegistrationType(e.target.value)}
          className="border border-[#cbd5e1] rounded-lg px-3 py-2 text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] focus:border-transparent bg-white shadow-sm"
        >
          <option value="all">All Sections</option>
          <option value="library">Library</option>
          <option value="computer_center">Computer Center</option>
        </select>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className={`rounded-[2rem] p-7 cursor-default shadow-lg border border-white/20 ${
                stat.color === 'blue' ? 'bg-gradient-to-br from-[#e0eaf5] to-[#d0e0f3] shadow-[0_12px_30px_rgba(200,218,240,1)]' :
                stat.color === 'green' ? 'bg-gradient-to-br from-[#e2f5ea] to-[#c8eccc] shadow-[0_12px_30px_rgba(200,236,204,1)]' :
                stat.color === 'yellow' ? 'bg-gradient-to-br from-[#f3e7ce] to-[#e4cc95] shadow-[0_12px_30px_rgba(228,204,149,1)]' :
                'bg-gradient-to-br from-[#fce2e5] to-[#f4c8cb] shadow-[0_12px_30px_rgba(244,200,203,1)]'
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-white/40 shadow-inner`}>
                  <stat.icon className={
                    stat.color === 'blue' ? 'text-[#1e3a8a]' :
                    stat.color === 'green' ? 'text-[#14532d]' :
                    stat.color === 'yellow' ? 'text-[#78350f]' : 'text-[#7f1d1d]'
                  } size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-[32px] font-bold text-[#1e293b] leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-[#64748b]">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mb-7">
          <h2 className="text-lg font-semibold text-[#1e293b] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.label}
                label={action.label}
                icon={action.icon}
                path={action.path}
              />
            ))}
          </div>
        </motion.div>

        {/* Pending Fee */}
        <motion.div variants={itemVariants} className="mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold text-[#1e293b]">Pending Fee</h2>
            <div className="text-left sm:text-right">
              <p className="text-xs text-[#64748b]">Total Pending</p>
              <p className="text-xl font-bold text-[#dc2626]">
                Rs. {(statsData?.pendingFeeTotal || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-[#f8f9fa] rounded-3xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden p-3 border border-[#e2e8f0]">
            {pendingFees.length > 0 ? (
              <div className="space-y-3">
                {pendingFees.map((student: any) => (
                  <div key={student.studentId} className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="w-12 h-12 bg-[#fdf2f2] rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
                      <ReceiptText className="text-[#dc2626]" size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1e293b] text-base truncate">{student.name}</p>
                      <p className="text-sm text-[#64748b]">
                        {student.studentId} - {getCourseLabel(student.course)} - {getTimeShiftLabel(student.timeShift, student.customShiftHours)}
                        {(student.overdueMonths ?? 0) > 1 && (
                          <span className="text-[#dc2626] font-medium"> · {student.overdueMonths} months due</span>
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 text-sm sm:min-w-[340px]">
                      <div>
                        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Monthly</p>
                        <p className="font-bold text-[#1e293b] mt-0.5">Rs. {student.monthlyFee.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Paid</p>
                        <p className="font-bold text-[#22c55e] mt-0.5">Rs. {student.paidAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Pending</p>
                        <p className="font-bold text-[#dc2626] mt-0.5">Rs. {student.pendingAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openFeesPayModal(student.studentId)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-b from-[#dc2626] to-[#991b1b] shadow-[0_4px_12px_rgba(220,38,38,0.4)] text-white text-sm font-bold rounded-xl hover:from-[#ef4444] hover:to-[#b91c1c] transition-all"
                    >
                      Collect
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <ReceiptText className="mx-auto mb-3 text-[#22c55e]" size={28} />
                <p className="font-semibold text-[#1e293b]">No pending fee</p>
                <p className="text-sm text-[#64748b] mt-1">All active students are paid for this month.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
