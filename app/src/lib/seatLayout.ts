export const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'G', 'N', 'Ex'] as const;

export const SEAT_CONFIG: Record<string, number> = {
  A: 25,
  B: 25,
  C: 20,
  D: 20,
  G: 20,
  N: 60,
  Ex: 30
};

export const TOTAL_SEAT_CAPACITY = 200;

export const generateAllSeatNumbers = (): string[] => {
  const seats: string[] = [];
  for (const column of SEAT_COLUMNS) {
    const count = SEAT_CONFIG[column] || 0;
    for (let row = 1; row <= count; row += 1) {
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
