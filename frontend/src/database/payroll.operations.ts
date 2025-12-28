import { db } from './db';
import { Payroll, Payslip, PayrollSummary, APP_CONSTANTS } from '../types';
import { getStaffById, getAllStaff } from './staff.operations';
import { getTotalHoursForMonth } from './attendance.operations';

/**
 * Generate UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate payroll for a single staff member
 */
export async function generatePayroll(staffId: string, month: string): Promise<Payroll> {
  // Check if payroll already exists for this staff and month
  const existingPayroll = await db.payrolls
    .where('[staffId+month]')
    .equals([staffId, month])
    .first();

  if (existingPayroll) {
    throw new Error(`Payroll already exists for ${staffId} in ${month}`);
  }

  const staff = await getStaffById(staffId);
  if (!staff) {
    throw new Error(`Staff with ID ${staffId} not found`);
  }

  const totalHoursWorked = await getTotalHoursForMonth(staffId, month);
  const hourlyRate = staff.hourlyRate;
  const grossPay = Math.round(totalHoursWorked * hourlyRate * 100) / 100;

  const payroll: Payroll = {
    id: generateUUID(),
    staffId,
    month,
    totalHoursWorked,
    hourlyRate,
    grossPay,
    generatedAt: new Date(),
    isFinalized: false
  };

  await db.payrolls.add(payroll);
  return payroll;
}

/**
 * Generate payroll for all active staff members
 */
export async function generateBulkPayroll(month: string): Promise<Payroll[]> {
  const allStaff = await getAllStaff();
  const activeStaff = allStaff.filter(s => s.isActive);
  
  const payrolls: Payroll[] = [];
  
  for (const staff of activeStaff) {
    try {
      const payroll = await generatePayroll(staff.id, month);
      payrolls.push(payroll);
    } catch (error) {
      // Skip if payroll already exists
      console.warn(`Skipping payroll for ${staff.id}: ${error}`);
    }
  }

  return payrolls;
}

/**
 * Get payroll by ID
 */
export async function getPayrollById(id: string): Promise<Payroll | undefined> {
  return await db.payrolls.get(id);
}

/**
 * Get all payrolls for a staff member
 */
export async function getPayrollsByStaff(staffId: string): Promise<Payroll[]> {
  return await db.payrolls
    .where('staffId')
    .equals(staffId)
    .reverse()
    .sortBy('month');
}

/**
 * Get all payrolls for a month
 */
export async function getPayrollsByMonth(month: string): Promise<Payroll[]> {
  return await db.payrolls.where('month').equals(month).toArray();
}

/**
 * Finalize payroll (locks attendance records)
 */
export async function finalizePayroll(payrollId: string): Promise<Payroll> {
  const payroll = await db.payrolls.get(payrollId);
  if (!payroll) {
    throw new Error(`Payroll with ID ${payrollId} not found`);
  }

  if (payroll.isFinalized) {
    throw new Error('Payroll is already finalized');
  }

  await db.payrolls.update(payrollId, { isFinalized: true });
  
  return { ...payroll, isFinalized: true };
}

/**
 * Generate payslip from payroll
 */
export async function generatePayslip(payrollId: string): Promise<Payslip> {
  const payroll = await db.payrolls.get(payrollId);
  if (!payroll) {
    throw new Error(`Payroll with ID ${payrollId} not found`);
  }

  // Check if payslip already exists
  const existingPayslip = await db.payslips
    .where('payrollId')
    .equals(payrollId)
    .first();

  if (existingPayslip) {
    return existingPayslip;
  }

  const staff = await getStaffById(payroll.staffId);
  if (!staff) {
    throw new Error(`Staff with ID ${payroll.staffId} not found`);
  }

  const payslip: Payslip = {
    id: generateUUID(),
    payrollId,
    staffName: `${staff.firstName} ${staff.lastName}`,
    staffId: staff.id,
    department: staff.department,
    role: staff.role,
    month: payroll.month,
    totalHours: payroll.totalHoursWorked,
    hourlyRate: payroll.hourlyRate,
    grossPay: payroll.grossPay,
    employer: APP_CONSTANTS.EMPLOYER_NAME as 'ASTROBSM',
    generatedAt: new Date()
  };

  await db.payslips.add(payslip);
  return payslip;
}

/**
 * Get payslip by ID
 */
export async function getPayslipById(id: string): Promise<Payslip | undefined> {
  return await db.payslips.get(id);
}

/**
 * Get all payslips for a staff member
 */
export async function getPayslipsByStaff(staffId: string): Promise<Payslip[]> {
  return await db.payslips
    .where('staffId')
    .equals(staffId)
    .reverse()
    .sortBy('month');
}

/**
 * Get payslip by payroll ID
 */
export async function getPayslipByPayroll(payrollId: string): Promise<Payslip | undefined> {
  return await db.payslips.where('payrollId').equals(payrollId).first();
}

/**
 * Get all payslips for a month
 */
export async function getPayslipsByMonth(month: string): Promise<Payslip[]> {
  return await db.payslips.where('month').equals(month).toArray();
}

/**
 * Get payroll summary for a month
 */
export async function getPayrollSummary(month: string): Promise<PayrollSummary> {
  const payrolls = await getPayrollsByMonth(month);
  
  const totalStaffPaid = payrolls.length;
  const totalHoursWorked = payrolls.reduce((sum, p) => sum + p.totalHoursWorked, 0);
  const totalGrossPay = payrolls.reduce((sum, p) => sum + p.grossPay, 0);

  return {
    month,
    totalStaffPaid,
    totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
    totalGrossPay: Math.round(totalGrossPay * 100) / 100,
    generatedAt: new Date()
  };
}

/**
 * Delete payroll (only if not finalized)
 */
export async function deletePayroll(payrollId: string): Promise<void> {
  const payroll = await db.payrolls.get(payrollId);
  if (!payroll) {
    throw new Error(`Payroll with ID ${payrollId} not found`);
  }

  if (payroll.isFinalized) {
    throw new Error('Cannot delete finalized payroll');
  }

  // Delete associated payslip if exists
  await db.payslips.where('payrollId').equals(payrollId).delete();
  await db.payrolls.delete(payrollId);
}
