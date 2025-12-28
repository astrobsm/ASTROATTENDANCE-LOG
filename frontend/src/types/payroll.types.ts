/**
 * Payroll Record - Monthly salary calculation
 */
export interface Payroll {
  id: string;                      // UUID
  staffId: string;                 // Reference to Staff.id
  month: string;                   // Format: YYYY-MM
  totalHoursWorked: number;        // Sum of all attendance hours
  hourlyRate: number;              // Rate at time of calculation
  grossPay: number;                // totalHoursWorked * hourlyRate
  generatedAt: Date;
  isFinalized: boolean;            // Once true, attendance records are locked
}

/**
 * Payroll generation request
 */
export interface GeneratePayrollPayload {
  staffId: string;
  month: string;                   // Format: YYYY-MM
}

/**
 * Bulk payroll generation for all staff
 */
export interface BulkPayrollPayload {
  month: string;                   // Format: YYYY-MM
}

/**
 * Payroll summary for dashboard
 */
export interface PayrollSummary {
  month: string;
  totalStaffPaid: number;
  totalHoursWorked: number;
  totalGrossPay: number;
  generatedAt: Date;
}
