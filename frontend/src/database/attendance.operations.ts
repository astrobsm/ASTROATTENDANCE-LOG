import { db } from './db';
import { AttendanceLog, AttendanceStatus, MonthlyAttendanceSummary } from '../types';
import { getStaffById } from './staff.operations';

/**
 * Generate UUID for attendance records
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate hours between two ISO timestamps
 * Returns value rounded to 2 decimal places
 */
function calculateHours(clockIn: string, clockOut: string): number {
  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();
  const hours = (end - start) / 3600000; // Convert ms to hours
  return Math.round(hours * 100) / 100; // Round to 2 decimals
}

/**
 * Get attendance record for a staff member on a specific date
 */
export async function getAttendanceForDate(staffId: string, date: string): Promise<AttendanceLog | undefined> {
  return await db.attendanceLogs
    .where('[staffId+date]')
    .equals([staffId, date])
    .first();
}

/**
 * Clock in a staff member
 * Rules:
 * - Only one clock-in per day
 * - Cannot clock-in twice without clock-out
 */
export async function clockIn(staffId: string): Promise<AttendanceLog> {
  const today = getTodayDate();
  
  // Check if already clocked in today
  const existingLog = await getAttendanceForDate(staffId, today);
  
  if (existingLog) {
    if (existingLog.clockIn && !existingLog.clockOut) {
      throw new Error('Already clocked in today. Please clock out first.');
    }
    if (existingLog.clockIn && existingLog.clockOut) {
      throw new Error('Already completed attendance for today.');
    }
  }

  const attendanceLog: AttendanceLog = {
    id: generateUUID(),
    staffId,
    date: today,
    clockIn: getCurrentTimestamp(),
    clockOut: null,
    totalHours: 0
  };

  await db.attendanceLogs.add(attendanceLog);
  return attendanceLog;
}

/**
 * Clock out a staff member
 * Rules:
 * - Must have clock-in first
 * - Clock-out time must be after clock-in time
 */
export async function clockOut(staffId: string): Promise<AttendanceLog> {
  const today = getTodayDate();
  
  const existingLog = await getAttendanceForDate(staffId, today);
  
  if (!existingLog) {
    throw new Error('No clock-in record found for today. Please clock in first.');
  }
  
  if (!existingLog.clockIn) {
    throw new Error('No clock-in time recorded. Please clock in first.');
  }
  
  if (existingLog.clockOut) {
    throw new Error('Already clocked out for today.');
  }

  const clockOutTime = getCurrentTimestamp();
  const totalHours = calculateHours(existingLog.clockIn, clockOutTime);

  await db.attendanceLogs.update(existingLog.id, {
    clockOut: clockOutTime,
    totalHours
  });

  return {
    ...existingLog,
    clockOut: clockOutTime,
    totalHours
  };
}

/**
 * Get attendance status for a staff member today
 */
export async function getAttendanceStatus(staffId: string): Promise<AttendanceStatus> {
  const staff = await getStaffById(staffId);
  if (!staff) {
    throw new Error(`Staff with ID ${staffId} not found`);
  }

  const today = getTodayDate();
  const log = await getAttendanceForDate(staffId, today);

  return {
    staffId,
    staffName: `${staff.firstName} ${staff.lastName}`,
    date: today,
    isClockedIn: !!log?.clockIn && !log?.clockOut,
    clockedIn: !!log?.clockIn,
    clockedOut: !!log?.clockOut,
    clockInTime: log?.clockIn || null,
    clockOutTime: log?.clockOut || null,
    totalHours: log?.totalHours || 0
  };
}

/**
 * Get all attendance logs for a staff member
 */
export async function getAttendanceLogsByStaff(staffId: string): Promise<AttendanceLog[]> {
  return await db.attendanceLogs
    .where('staffId')
    .equals(staffId)
    .reverse()
    .sortBy('date');
}

/**
 * Get attendance logs for a staff member in a date range
 */
export async function getAttendanceLogsByDateRange(
  staffId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceLog[]> {
  return await db.attendanceLogs
    .where('staffId')
    .equals(staffId)
    .and((log: AttendanceLog) => log.date >= startDate && log.date <= endDate)
    .toArray();
}

/**
 * Get attendance logs for a specific month
 */
export async function getAttendanceLogsByMonth(staffId: string, month: string): Promise<AttendanceLog[]> {
  const startDate = `${month}-01`;
  const endDate = `${month}-31`; // Will work for any month
  
  return await db.attendanceLogs
    .where('[staffId+date]')
    .between([staffId, startDate], [staffId, endDate], true, true)
    .toArray();
}

/**
 * Calculate monthly attendance summary
 */
export async function getMonthlyAttendanceSummary(
  staffId: string,
  month: string
): Promise<MonthlyAttendanceSummary> {
  const logs = await getAttendanceLogsByMonth(staffId, month);
  
  const completedLogs = logs.filter(log => log.clockIn && log.clockOut);
  const totalHours = completedLogs.reduce((sum, log) => sum + log.totalHours, 0);
  const totalDaysWorked = completedLogs.length;
  const averageHoursPerDay = totalDaysWorked > 0 ? Math.round((totalHours / totalDaysWorked) * 100) / 100 : 0;

  return {
    month,
    staffId,
    daysPresent: totalDaysWorked,
    totalDaysWorked,
    totalHours: Math.round(totalHours * 100) / 100,
    averageHoursPerDay
  };
}

/**
 * Get all attendance logs for a specific date
 */
export async function getAttendanceLogsByDate(date: string): Promise<AttendanceLog[]> {
  return await db.attendanceLogs.where('date').equals(date).toArray();
}

/**
 * Check if attendance records are locked for a month (payroll finalized)
 */
export async function isMonthLocked(staffId: string, month: string): Promise<boolean> {
  const payroll = await db.payrolls
    .where('[staffId+month]')
    .equals([staffId, month])
    .first();
  
  return payroll?.isFinalized ?? false;
}

/**
 * Get total hours worked for a staff member in a month
 */
export async function getTotalHoursForMonth(staffId: string, month: string): Promise<number> {
  const logs = await getAttendanceLogsByMonth(staffId, month);
  const totalHours = logs.reduce((sum, log) => sum + log.totalHours, 0);
  return Math.round(totalHours * 100) / 100;
}
