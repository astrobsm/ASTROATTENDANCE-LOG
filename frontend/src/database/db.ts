import Dexie, { Table } from 'dexie';
import { Staff, AttendanceLog, Payroll, Payslip } from '../types';

/**
 * System configuration table for storing app-wide settings
 */
export interface SystemConfig {
  key: string;
  value: string | number | boolean;
}

/**
 * AstroBSM Database - IndexedDB using Dexie.js
 * All data persists locally on the staff computer
 */
export class AstroBSMDatabase extends Dexie {
  staff!: Table<Staff, string>;
  attendanceLogs!: Table<AttendanceLog, string>;
  payrolls!: Table<Payroll, string>;
  payslips!: Table<Payslip, string>;
  systemConfig!: Table<SystemConfig, string>;

  constructor() {
    super('AstroBSMDatabase');

    this.version(1).stores({
      // Staff table - indexed by id, searchable by department, role, isActive
      staff: 'id, department, role, isActive, createdAt, firstName, lastName',
      
      // Attendance logs - compound index for date+staffId queries
      attendanceLogs: 'id, staffId, date, [staffId+date], clockIn, clockOut',
      
      // Payroll records - indexed for monthly queries
      payrolls: 'id, staffId, month, [staffId+month], generatedAt, isFinalized',
      
      // Payslips - indexed for lookup
      payslips: 'id, payrollId, staffId, month, generatedAt',
      
      // System configuration - key-value store
      systemConfig: 'key'
    });
  }
}

// Singleton database instance
export const db = new AstroBSMDatabase();

/**
 * Initialize database with default values
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if staff counter exists
    const counterExists = await db.systemConfig.get('staffCounter');
    if (!counterExists) {
      await db.systemConfig.put({ key: 'staffCounter', value: 0 });
    }

    console.log('AstroBSM Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Clear all database tables (use with caution)
 */
export async function clearDatabase(): Promise<void> {
  await db.transaction('rw', [db.staff, db.attendanceLogs, db.payrolls, db.payslips], async () => {
    await db.staff.clear();
    await db.attendanceLogs.clear();
    await db.payrolls.clear();
    await db.payslips.clear();
  });
  // Reset counter but keep config
  await db.systemConfig.put({ key: 'staffCounter', value: 0 });
}

/**
 * Export database for backup
 */
export async function exportDatabase(): Promise<object> {
  const [staff, attendanceLogs, payrolls, payslips, systemConfig] = await Promise.all([
    db.staff.toArray(),
    db.attendanceLogs.toArray(),
    db.payrolls.toArray(),
    db.payslips.toArray(),
    db.systemConfig.toArray()
  ]);

  return {
    exportDate: new Date().toISOString(),
    version: 1,
    data: {
      staff,
      attendanceLogs,
      payrolls,
      payslips,
      systemConfig
    }
  };
}
