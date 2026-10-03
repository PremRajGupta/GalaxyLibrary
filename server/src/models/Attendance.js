import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  organizationId: { type: String, required: true },
  branchId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, required: true },
  studentDisplayId: { type: String },
  seatNumber: { type: String, default: '--' },
  timeShift: { type: String, default: '8hours' },
  registrationType: { type: String, enum: ['library', 'computer_center'], default: 'library' },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  inTime: { type: String, default: '' }, // e.g. "08:30 AM"
  inTimestamp: { type: Date },
  outTime: { type: String, default: '' }, // e.g. "02:45 PM"
  outTimestamp: { type: Date },
  timeSpentMinutes: { type: Number, default: 0 },
  timeSpentFormatted: { type: String, default: '0m' },
  // Multi-punch sessions (Break & re-entry tracking throughout the day)
  sessions: [
    {
      inTime: { type: String, required: true },
      inTimestamp: { type: Date, default: Date.now },
      outTime: { type: String, default: '' },
      outTimestamp: { type: Date },
      durationMinutes: { type: Number, default: 0 },
      method: { type: String, default: 'biometric' },
      remarks: { type: String, default: '' },
    },
  ],
  status: {
    type: String,
    enum: ['present', 'completed', 'absent', 'late', 'half_day'],
    default: 'present',
  },
  method: {
    type: String,
    enum: ['manual', 'qr', 'biometric'],
    default: 'manual',
  },
  remarks: { type: String, default: '' },
}, {
  timestamps: true,
});

// Indexes for super-fast date & student queries
attendanceSchema.index({ organizationId: 1, branchId: 1, date: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ date: 1, status: 1 });

export default mongoose.model('Attendance', attendanceSchema);
