import { parseDateInputValue } from './formatDate';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BILLING_DAYS = 30;
const BILLING_MS = BILLING_DAYS * MS_PER_DAY;

export type FeePaymentLike = {
  month: string;
  amount: number;
  paymentDate?: string | Date;
};

export type FeeDueBreakdown = {
  pendingAmount: number;
  paidAmount: number;
  expectedTotal: number;
  overdueMonths: number;
  currentMonthPaid: number;
};

export const getGracePeriodEnd = (joinDate: Date): Date => {
  const end = new Date(joinDate);
  end.setDate(end.getDate() + 30);
  return end;
};

function formatPeriodLabel(index: number, billingStart: Date): string {
  const labelDate = new Date(billingStart);
  labelDate.setMonth(labelDate.getMonth() + index);
  const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  return labelDate.toLocaleDateString('en-IN', options);
}

function getBillablePeriodCount(startDate: Date, asOf: Date): number {
  if (asOf < startDate) return 0;
  const elapsed = asOf.getTime() - startDate.getTime();
  return Math.floor(elapsed / BILLING_MS) + 1;
}

export const computeStudentFeeDue = ({
  monthlyFee,
  joiningDate,
  payments,
  asOf = new Date(),
}: {
  monthlyFee: number;
  joiningDate?: string | Date | null;
  payments: FeePaymentLike[];
  asOf?: Date;
}): FeeDueBreakdown => {
  const empty: FeeDueBreakdown = {
    pendingAmount: 0,
    paidAmount: 0,
    expectedTotal: 0,
    overdueMonths: 0,
    currentMonthPaid: 0,
  };

  if (!monthlyFee || monthlyFee <= 0) return empty;

  const joinDate = parseDateInputValue(joiningDate) || asOf;
  // Advance billing: the first 30-day period starts immediately from joiningDate.
  const billingStart = joinDate;
  const periodCount = getBillablePeriodCount(billingStart, asOf);
  if (periodCount <= 0) return empty;

  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const expectedTotal = periodCount * monthlyFee;

  let overdueMonths = 0;
  let currentMonthPaid = 0;
  const currentStart = new Date(billingStart.getTime() + (periodCount - 1) * BILLING_MS);

  let remainingPaid = Math.max(0, paidAmount);

  for (let i = 0; i < periodCount; i += 1) {
    const start = new Date(billingStart.getTime() + i * BILLING_MS);

    const allocated = Math.min(remainingPaid, monthlyFee);
    remainingPaid -= allocated;
    remainingPaid = Math.max(0, remainingPaid);

    if (allocated < monthlyFee) {
      overdueMonths += 1;
    }

    if (start.getTime() === currentStart.getTime()) {
      currentMonthPaid = allocated;
    }
  }

  return {
    pendingAmount: Math.max(expectedTotal - paidAmount, 0),
    paidAmount,
    expectedTotal,
    overdueMonths,
    currentMonthPaid,
  };
};

export const getUnpaidMonthOptions = (
  monthlyFee: number,
  joiningDate: string | Date | null | undefined,
  payments: FeePaymentLike[],
  asOf: Date = new Date(),
): string[] => {
  const joinDate = parseDateInputValue(joiningDate) || asOf;
  const billingStart = joinDate;
  const periodCount = getBillablePeriodCount(billingStart, asOf);
  if (!monthlyFee || monthlyFee <= 0 || periodCount <= 0) return [];

  const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  let remainingPaid = Math.max(0, paidAmount);

  const options: string[] = [];
  for (let i = 0; i < periodCount; i += 1) {
    const allocated = Math.min(remainingPaid, monthlyFee);
    remainingPaid -= allocated;
    remainingPaid = Math.max(0, remainingPaid);

    if (allocated < monthlyFee) {
      options.push(formatPeriodLabel(i, billingStart));
    }
  }

  return options;
};
