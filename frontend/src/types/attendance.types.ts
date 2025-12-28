/**
 * Attendance Log Model - Records daily clock-in/out
 */
export interface AttendanceLog {
  id: string;                      // UUID
  staffId: string;                 // Reference to Staff.id
  date: string;                    // Format: YYYY-MM-DD
  clockIn: string | null;          // ISO timestamp
  clockOut: string | null;         // ISO timestamp
  totalHours: number;              // Calculated, rounded to 2 decimals
}

/**
 * Clock action types
 */
export type ClockAction = 'clock-in' | 'clock-out';

/**
 * Attendance status for display
 */
export interface AttendanceStatus {
  staffId: string;
  staffName?: string;
  date: string;
  isClockedIn: boolean;
  clockedIn?: boolean;
  clockedOut?: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  totalHours: number;
}

/**
 * Daily attendance summary
 */
export interface DailyAttendanceSummary {
  date: string;
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  averageHours: number;
}

/**
 * Weekly attendance summary
 */
export interface WeeklyAttendanceSummary {
  weekStart: string;
  weekEnd: string;
  staffId: string;
  totalDays: number;
  totalHours: number;
  averageHoursPerDay: number;
}

/**
 * Monthly attendance summary
 */
export interface MonthlyAttendanceSummary {
  month: string;                   // Format: YYYY-MM
  staffId: string;
  daysPresent: number;
  totalDaysWorked?: number;
  totalHours: number;
  averageHoursPerDay: number;
}
