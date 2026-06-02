export const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'N', 'Ex', 'G'] as const;
export const SEAT_ROWS = 25;
export const TOTAL_SEAT_CAPACITY = SEAT_COLUMNS.length * SEAT_ROWS;

export const generateAllSeatNumbers = (): string[] => {
  const seats: string[] = [];
  for (let row = 1; row <= SEAT_ROWS; row += 1) {
    for (const column of SEAT_COLUMNS) {
      seats.push(`${column}${row}`);
    }
  }
  return seats;
};

const LIBRARY_SEAT_SET = new Set(generateAllSeatNumbers());

export const isLibrarySeatNumber = (seatNumber: string) =>
  LIBRARY_SEAT_SET.has(String(seatNumber || '').trim());

export const getAvailableSeatsFromStudents = (students: Array<{ status?: string; seatNumber?: string }>) => {
  const occupied = new Set(
    students
      .filter(
        (student) =>
          student.status === 'active' &&
          student.seatNumber &&
          student.seatNumber !== '--' &&
          student.seatNumber !== 'other' &&
          isLibrarySeatNumber(student.seatNumber)
      )
      .map((student) => String(student.seatNumber).trim())
  );

  return generateAllSeatNumbers().filter((seat) => !occupied.has(seat));
};
