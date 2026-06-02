export interface Student {
  id: string;
  name: string;
  studentId: string;
  course: string;
  seat: string;
  contact: string;
  admissionDate: string;
  joiningDate?: string;
  status: 'active' | 'inactive' | 'expired';
  photo?: string; // data URL
  aadharNumber?: string;
  aadharFront?: string; // data URL
  aadharBack?: string; // data URL
}

export const initialStudents: Student[] = [
  { id: '1', name: 'Prem Kumar', studentId: 'STUprem_1001', course: '10th', seat: 'A1', contact: '9876543210', admissionDate: '2024-01-15', status: 'expired' },
  { id: '2', name: 'Hemant Kumar', studentId: 'STUhemant_1002', course: '12th', seat: '--', contact: '9876543211', admissionDate: '2024-02-01', status: 'expired' },
  { id: '3', name: 'Vishal Kumar', studentId: 'STUvishal_1012', course: 'Undergraduate', seat: 'B3', contact: '9876543212', admissionDate: '2024-03-10', status: 'active' },
  { id: '4', name: 'Sneha Sharma', studentId: 'STUsneha_1005', course: '10th', seat: 'C1', contact: '9876543213', admissionDate: '2024-04-01', status: 'active' },
  { id: '5', name: 'Rahul Kumar', studentId: 'STUrahul_1008', course: 'Postgraduate', seat: 'D2', contact: '9876543214', admissionDate: '2024-04-15', status: 'active' },
  { id: '6', name: 'Priya Mishra', studentId: 'STUpriya_1015', course: '12th', seat: 'A4', contact: '9876543215', admissionDate: '2024-05-01', status: 'active' },
  { id: '7', name: 'Vikram Singh', studentId: 'STUvikram_1018', course: 'Undergraduate', seat: '--', contact: '9876543216', admissionDate: '2024-05-10', status: 'inactive' },
];
