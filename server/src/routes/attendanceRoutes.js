import express from 'express';
import {
  getAttendance,
  markCheckIn,
  markCheckOut,
  saveManualAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';

const router = express.Router();

// GET /api/v1/attendance?date=YYYY-MM-DD&shift=...&status=...&search=...
router.get('/', getAttendance);

// POST /api/v1/attendance/check-in
router.post('/check-in', markCheckIn);

// POST /api/v1/attendance/check-out
router.post('/check-out', markCheckOut);

// POST /api/v1/attendance/manual (Save / update full record)
router.post('/manual', saveManualAttendance);

// DELETE /api/v1/attendance/:id
router.delete('/:id', deleteAttendance);

export default router;
