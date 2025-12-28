// Cloud API Service - Communicates with Vercel Postgres backend
// This provides cloud storage in addition to local IndexedDB

const API_BASE = '/api';

export interface CloudStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hourlyRate: number;
  fingerprintTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloudAttendance {
  id: number;
  staffId: string;
  clockIn: string;
  clockOut: string | null;
  date: string;
  hoursWorked: number | null;
}

export interface CloudPayroll {
  id: number;
  staffId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: string;
  generatedAt: string;
}

// Check if cloud API is available
export async function checkCloudStatus(): Promise<{ available: boolean; dbInitialized: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      const data = await response.json();
      return { available: true, dbInitialized: data.initialized };
    }
    return { available: false, dbInitialized: false };
  } catch {
    return { available: false, dbInitialized: false };
  }
}

// Initialize database tables
export async function initializeCloudDatabase(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'POST'
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Staff Operations
export async function cloudGetAllStaff(): Promise<CloudStaff[]> {
  const response = await fetch(`${API_BASE}/staff`);
  if (!response.ok) throw new Error('Failed to fetch staff');
  const data = await response.json();
  return data.staff || [];
}

export async function cloudGetStaff(id: string): Promise<CloudStaff | null> {
  const response = await fetch(`${API_BASE}/staff?id=${id}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.staff || null;
}

export async function cloudCreateStaff(staff: Omit<CloudStaff, 'createdAt' | 'updatedAt'>): Promise<CloudStaff | null> {
  const response = await fetch(`${API_BASE}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(staff)
  });
  if (!response.ok) throw new Error('Failed to create staff');
  const data = await response.json();
  return data.staff || null;
}

export async function cloudUpdateStaff(id: string, updates: Partial<CloudStaff>): Promise<CloudStaff | null> {
  const response = await fetch(`${API_BASE}/staff`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates })
  });
  if (!response.ok) throw new Error('Failed to update staff');
  const data = await response.json();
  return data.staff || null;
}

export async function cloudDeleteStaff(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/staff?id=${id}`, {
    method: 'DELETE'
  });
  return response.ok;
}

// Attendance Operations
export async function cloudGetAttendance(staffId?: string, startDate?: string, endDate?: string): Promise<CloudAttendance[]> {
  const params = new URLSearchParams();
  if (staffId) params.append('staffId', staffId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${API_BASE}/attendance?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch attendance');
  const data = await response.json();
  return data.attendance || [];
}

export async function cloudClockIn(staffId: string): Promise<CloudAttendance | null> {
  const response = await fetch(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clockIn', staffId })
  });
  if (!response.ok) throw new Error('Failed to clock in');
  const data = await response.json();
  return data.attendance || null;
}

export async function cloudClockOut(staffId: string): Promise<CloudAttendance | null> {
  const response = await fetch(`${API_BASE}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clockOut', staffId })
  });
  if (!response.ok) throw new Error('Failed to clock out');
  const data = await response.json();
  return data.attendance || null;
}

// Payroll Operations
export async function cloudGetPayrolls(staffId?: string, status?: string): Promise<CloudPayroll[]> {
  const params = new URLSearchParams();
  if (staffId) params.append('staffId', staffId);
  if (status) params.append('status', status);
  
  const response = await fetch(`${API_BASE}/payroll?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch payrolls');
  const data = await response.json();
  return data.payrolls || [];
}

export async function cloudGeneratePayroll(staffId: string, periodStart: string, periodEnd: string): Promise<CloudPayroll | null> {
  const response = await fetch(`${API_BASE}/payroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId, periodStart, periodEnd })
  });
  if (!response.ok) throw new Error('Failed to generate payroll');
  const data = await response.json();
  return data.payroll || null;
}

export async function cloudUpdatePayrollStatus(id: number, status: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/payroll`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  });
  return response.ok;
}

// Sync utilities - sync local IndexedDB data to cloud
export interface SyncResult {
  staffSynced: number;
  attendanceSynced: number;
  payrollSynced: number;
  errors: string[];
}

export async function syncToCloud(
  localStaff: CloudStaff[],
  localAttendance: CloudAttendance[],
  localPayrolls: CloudPayroll[]
): Promise<SyncResult> {
  const result: SyncResult = {
    staffSynced: 0,
    attendanceSynced: 0,
    payrollSynced: 0,
    errors: []
  };

  // Sync staff
  for (const staff of localStaff) {
    try {
      const existing = await cloudGetStaff(staff.id);
      if (!existing) {
        await cloudCreateStaff(staff);
        result.staffSynced++;
      }
    } catch (e) {
      result.errors.push(`Failed to sync staff ${staff.id}: ${e}`);
    }
  }

  // Note: Attendance and payroll sync would need more sophisticated
  // conflict resolution logic in a production app

  return result;
}

export default {
  checkCloudStatus,
  initializeCloudDatabase,
  cloudGetAllStaff,
  cloudGetStaff,
  cloudCreateStaff,
  cloudUpdateStaff,
  cloudDeleteStaff,
  cloudGetAttendance,
  cloudClockIn,
  cloudClockOut,
  cloudGetPayrolls,
  cloudGeneratePayroll,
  cloudUpdatePayrollStatus,
  syncToCloud
};
