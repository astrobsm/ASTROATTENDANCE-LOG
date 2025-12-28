// Database exports
export { db, initializeDatabase, clearDatabase, exportDatabase } from './db';

// Staff operations
export {
  createStaff,
  getAllStaff,
  getActiveStaff,
  getStaffById,
  getStaffByFingerprintId,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  getStaffByDepartment,
  getAllDepartments,
  getStaffCount,
  getActiveStaffCount,
  searchStaffByName
} from './staff.operations';

// Attendance operations
export {
  getTodayDate,
  getAttendanceForDate,
  clockIn,
  clockOut,
  getAttendanceStatus,
  getAttendanceLogsByStaff,
  getAttendanceLogsByDateRange,
  getAttendanceLogsByMonth,
  getMonthlyAttendanceSummary,
  getAttendanceLogsByDate,
  isMonthLocked,
  getTotalHoursForMonth
} from './attendance.operations';

// Payroll operations
export {
  generatePayroll,
  generateBulkPayroll,
  getPayrollById,
  getPayrollsByStaff,
  getPayrollsByMonth,
  finalizePayroll,
  generatePayslip,
  getPayslipById,
  getPayslipsByStaff,
  getPayslipByPayroll,
  getPayslipsByMonth,
  getPayrollSummary,
  deletePayroll
} from './payroll.operations';
