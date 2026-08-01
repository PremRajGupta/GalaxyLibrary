import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import { Armchair, X } from 'lucide-react';
import { seatApi, studentApi } from '../lib/apiService';
import { SEAT_COLUMNS, SEAT_CONFIG } from '../lib/seatLayout';

type SeatStatus = 'available' | 'occupied' | 'reserved';

interface Seat {
  id: string;
  number: string;
  column: string;
  status: SeatStatus;
  studentName?: string;
  studentId?: string;
  studentMobile?: string;
  fatherName?: string;
  studentPhoto?: string;
}

const statusColors: Record<SeatStatus, string> = {
  available: 'bg-[#dcfce7] border-[#22c55e] text-[#22c55e]',
  occupied: 'bg-[#fef2f2] border-[#ef4444] text-[#ef4444]',
  reserved: 'bg-[#fef9c3] border-[#eab308] text-[#eab308]',
};

const statusLabels: Record<SeatStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
};

const generateBaseSeats = (): Seat[] => {
  const baseSeats: Seat[] = [];
  for (const column of SEAT_COLUMNS) {
    const count = SEAT_CONFIG[column] || 0;
    for (let row = 1; row <= count; row += 1) {
      const number = column.length > 1 ? `${column} ${row}` : `${column}${row}`;
      baseSeats.push({
        id: `seat-${number}`,
        number,
        column,
        status: 'available',
      });
    }
  }
  return baseSeats;
};

export default function SeatMap() {
  const location = useLocation();
  const [seats, setSeats] = useState<Seat[]>(generateBaseSeats());
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [activeSection, setActiveSection] = useState<string>('A');

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const [data, students] = await Promise.all([
          seatApi.getSeats(),
          studentApi.getStudents(),
        ]);

        const occupiedByStudent = new Map<string, { name: string; studentId?: string; mobile?: string; fatherName?: string, photo?: string }>();
        students.forEach((student: any) => {
          if (
            student.status === 'active' &&
            student.seatNumber &&
            student.seatNumber !== '--' &&
            student.seatNumber !== 'other'
          ) {
            occupiedByStudent.set(String(student.seatNumber).trim(), {
              name: student.name,
              studentId: student.studentId,
              mobile: student.mobile,
              fatherName: student.fatherName,
              photo: student.photo,
            });
          }
        });

        setSeats((prevSeats) =>
          prevSeats.map((baseSeat) => {
            const studentOnSeat = occupiedByStudent.get(baseSeat.number);
            if (studentOnSeat) {
              return {
                ...baseSeat,
                status: 'occupied' as SeatStatus,
                studentName: studentOnSeat.name,
                studentId: studentOnSeat.studentId,
                studentMobile: studentOnSeat.mobile,
                fatherName: studentOnSeat.fatherName,
                studentPhoto: studentOnSeat.photo,
              };
            }

            const apiSeat = data.find((s: any) => s.seatNumber === baseSeat.number);
            if (apiSeat?.status === 'reserved') {
              return {
                ...baseSeat,
                status: 'reserved' as SeatStatus,
                studentName: apiSeat.studentName || undefined,
                studentId: apiSeat.studentId ? String(apiSeat.studentId) : undefined,
              };
            }

            return { ...baseSeat, status: 'available' as SeatStatus };
          })
        );
      } catch (error) {
        console.error('Failed to fetch seats:', error);
      }
    };
    fetchSeats();
  }, [location]);

  const stats = {
    available: seats.filter((s) => s.status === 'available').length,
    occupied: seats.filter((s) => s.status === 'occupied').length,
    reserved: seats.filter((s) => s.status === 'reserved').length,
  };

  return (
    <div>
      <TopHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="page-card">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-[#dcfce7] rounded-lg flex items-center justify-center">
              <Armchair className="text-[#22c55e]" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#1e293b]">Seat Map</h2>
              <p className="text-sm text-[#64748b]">Visual seat arrangement</p>
            </div>
          </div>

          {/* Legend - Top Row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-4 p-4 sm:p-5 bg-[#f8fafc] rounded-xl border border-slate-100 w-full">
            {(Object.keys(statusLabels) as SeatStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-md border-2 ${statusColors[status]}`} />
                <span className="text-sm font-semibold text-[#475569]">
                  {statusLabels[status]} <span className="text-[#1e293b] font-black ml-1">({stats[status]})</span>
                </span>
              </div>
            ))}
          </div>

          {/* Section Tabs - Second Row */}
          <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8 w-full">
            {SEAT_COLUMNS.map((col) => (
              <button
                key={col}
                onClick={() => setActiveSection(col)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeSection === col 
                  ? 'bg-[#1e293b] text-white shadow-md' 
                  : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-slate-50 hover:text-[#1e293b]'
                }`}
              >
                Section {col}
              </button>
            ))}
          </div>

          {/* Seat Grid */}
          <div className="pb-8">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 max-w-7xl mx-auto">
              {seats
                .filter((seat) => seat.column === activeSection)
                .map((seat, index) => {
                  return (
                    <motion.button
                      key={seat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.01, duration: 0.2 }}
                      whileHover={seat.status !== 'available' ? { scale: 1.03 } : {}}
                      whileTap={seat.status !== 'available' ? { scale: 0.97 } : {}}
                      onClick={() => (seat.status === 'occupied' || seat.status === 'reserved') && setSelectedSeat(seat as any)}
                      className={`relative min-h-[5.5rem] sm:min-h-[7rem] rounded-2xl border-2 flex flex-col justify-center transition-all duration-150 shadow-sm overflow-hidden ${
                        statusColors[seat.status]
                      } ${seat.status !== 'available' ? 'cursor-pointer hover:shadow-md' : 'cursor-default flex-row items-center justify-between px-4 sm:px-5'}`}
                    >
                      {seat.status === 'occupied' ? (
                        <div className="flex flex-col items-center w-full h-full p-1.5 pt-2">
                          <span className="absolute top-1.5 right-2 text-[10px] sm:text-xs font-black opacity-90 text-red-500">{seat.number}</span>
                          <div className="flex-1 flex items-center justify-center mt-1">
                            {seat.studentPhoto ? (
                              <img src={seat.studentPhoto} alt={seat.studentName} className="w-12 h-12 sm:w-16 sm:h-16 rounded-[0.9rem] object-cover shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[0.9rem] bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl shadow-sm">
                                {seat.studentName?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] sm:text-xs font-extrabold text-center leading-tight line-clamp-1 w-full px-1 text-slate-800 mt-1.5 pb-0.5">
                            {seat.studentName}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Armchair className="w-5 h-5 sm:w-6 sm:h-6 opacity-70" />
                          <span className="text-sm sm:text-base font-black">{seat.number}</span>
                        </>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Seat Detail Modal */}
        {selectedSeat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSeat(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1e293b]">Seat {selectedSeat.number}</h3>
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-[#64748b]" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Status</span>
                  <span className={`text-sm font-medium ${
                    selectedSeat.status === 'occupied' ? 'text-[#ef4444]' : 'text-[#eab308]'
                  }`}>
                    {statusLabels[selectedSeat.status]}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Student</span>
                  <span className="text-sm font-medium text-[#1e293b]">{selectedSeat.studentName || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Student ID</span>
                  <span className="text-sm font-medium text-[#1e293b]">{selectedSeat.studentId || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Mobile</span>
                  <span className="text-sm font-medium text-[#1e293b]">{selectedSeat.studentMobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-[#64748b]">Father's Name</span>
                  <span className="text-sm font-medium text-[#1e293b]">{selectedSeat.fatherName || 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
