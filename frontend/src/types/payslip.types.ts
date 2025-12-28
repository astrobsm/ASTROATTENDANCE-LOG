/**
 * Payslip Model - Official monthly pay document
 */
export interface Payslip {
  id: string;                      // UUID
  payrollId: string;               // Reference to Payroll.id
  staffName: string;               // Full name at time of generation
  staffId: string;                 // Staff ID (ASTRO-EMP-XXXX)
  department: string;              // Department at time of generation
  role: string;                    // Role at time of generation
  month: string;                   // Format: YYYY-MM
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  employer: 'ASTROBSM';            // Always ASTROBSM
  generatedAt: Date;
}

/**
 * Payslip PDF data for generation
 */
export interface PayslipPDFData {
  payslip: Payslip;
  companyName: string;
  companyAddress: string;
  payPeriod: string;
  payDate: string;
}
