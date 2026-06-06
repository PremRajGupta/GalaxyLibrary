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
  status: SeatStatus | 'empty';
  studentName?: string;
  studentId?: string;
  studentMobile?: string;
  fatherName?: string;
}

const statusColors: Record<SeatStatus | 'empty', string> = {
  available: 'bg-[#dcfce7] border-[#22c55e] text-[#22c55e]',
  occupied: 'bg-[#fee2e2] border-[#ef4444] text-[#ef4444]',
  reserved: 'bg-[#fef9c3] border-[#eab308] text-[#eab308]',
  empty: '',
};

const statusLabels: Record<SeatStatus | 'empty', string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  empty: '',
};

const generateBaseSeats = (): Seat[] => {
  const baseSeats: Seat[] = [];
  const maxRows = 60;
  for (let row = 1; row <= maxRows; row += 1) {
    for (const column of SEAT_COLUMNS) {
      const count = SEAT_CONFIG[column] || 0;
      if (row <= count) {
        const number = `${column}${row}`;
        baseSeats.push({
          id: `seat-${number}`,
          number,
          status: 'available' as SeatStatus,
        });
      } else {
        baseSeats.push({
          id: `empty-${column}${row}`,
          number: '',
          status: 'empty',
        });
      }
    }
  }
  return baseSeats;
};

export default function SeatMap() {
  const location = useLocation();
  const [seats, setSeats] = useState<Seat[]>(generateBaseSeats());
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const [data, students] = await Promise.all([
          seatApi.getSeats(),
          studentApi.getStudents(),
        ]);

        const occupiedByStudent = new Map<string, { name: string; studentId?: string; mobile?: string; fatherName?: string }>();
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

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 sm:mb-8 p-3 sm:p-4 bg-[#f8fafc] rounded-lg">
            {(Object.keys(statusLabels) as (SeatStatus | 'empty')[]).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 ${statusColors[status]}`} />
                <span className="text-sm text-[#64748b]">{statusLabels[status]}</span>
              </div>
            ))}
          </div>

          {/* Seat Grid */}
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-3 min-w-[500px] max-w-3xl mx-auto">
              {seats.map((seat, index) => {
                if (seat.status === 'empty') {
                  return (
                    <div key={seat.id} className="aspect-square" />
                  );
                }
                return (
                  <motion.button
                    key={seat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.002, duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (seat.status === 'occupied' || seat.status === 'reserved') && setSelectedSeat(seat as any)}
                    className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-150 ${
                      statusColors[seat.status]
                    } ${seat.status !== 'available' ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                  >
                    <Armchair className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-semibold">{seat.number}</span>
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
