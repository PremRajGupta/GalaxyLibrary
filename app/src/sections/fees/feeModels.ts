export interface StudentFee {
  id: string;
  name: string;
  studentId: string;
  course: string;
  seat: string;
  contact?: string;
  fatherName?: string;
  timeShift?: string;
  customShiftHours?: number;
  photo?: string;
  joiningDate?: string;
  monthlyFee: number;
  feeDue: number;
  overdueMonths?: number;
  lastPaid: string;
  status: 'active' | 'expired' | 'inactive';
}

export const initialFeeStudents: StudentFee[] = [
  { id: '1', name: 'Rimpi Kumari', studentId: 'STUrimpi_1001', course: '10th', seat: 'A1', contact: '9876543210', fatherName: '', monthlyFee: 500, feeDue: 1500, lastPaid: '2024-02-15', status: 'expired' },
  { id: '2', name: 'Amit Ranjan', studentId: 'STUamit_1002', course: '12th', seat: '--', contact: '9876543211', fatherName: '', monthlyFee: 800, feeDue: 2400, lastPaid: '2024-01-20', status: 'expired' },
  { id: '3', name: 'Reemzet Devop', studentId: 'STUreemzet_1012', course: 'Undergraduate', seat: 'B3', monthlyFee: 600, feeDue: 600, lastPaid: '2024-04-10', status: 'active' },
  { id: '4', name: 'Sneha Sharma', studentId: 'STUsneha_1005', course: '10th', seat: 'C1', monthlyFee: 500, feeDue: 500, lastPaid: '2024-04-25', status: 'active' },
  { id: '5', name: 'Rahul Kumar', studentId: 'STUrahul_1008', course: 'Postgraduate', seat: 'D2', monthlyFee: 700, feeDue: 1400, lastPaid: '2024-03-15', status: 'active' },
  { id: '6', name: 'Priya Mishra', studentId: 'STUpriya_1015', course: '12th', seat: 'A4', monthlyFee: 800, feeDue: 800, lastPaid: '2024-04-28', status: 'active' },
  { id: '7', name: 'Vikram Singh', studentId: 'STUvikram_1018', course: 'Undergraduate', seat: '--', monthlyFee: 600, feeDue: 1800, lastPaid: '2024-02-10', status: 'inactive' },
];

export const getInitials = (name: string) => {
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name: string) => {
  const colors = ['bg-[#3b82f6]', 'bg-[#22c55e]', 'bg-[#eab308]', 'bg-[#ef4444]', 'bg-[#8b5cf6]'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
