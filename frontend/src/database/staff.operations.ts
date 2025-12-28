import { db } from './db';
import { Staff, CreateStaffPayload, UpdateStaffPayload, APP_CONSTANTS } from '../types';

/**
 * Generate unique Staff ID in format ASTRO-EMP-XXXX
 * Uses atomic counter to ensure uniqueness
 */
async function generateStaffId(): Promise<string> {
  return await db.transaction('rw', db.systemConfig, async () => {
    const config = await db.systemConfig.get('staffCounter');
    const currentCount = (config?.value as number) || 0;
    const newCount = currentCount + 1;
    
    await db.systemConfig.put({ key: 'staffCounter', value: newCount });
    
    // Format: ASTRO-EMP-0001 (padded to 4 digits)
    const paddedNumber = newCount.toString().padStart(4, '0');
    return `${APP_CONSTANTS.STAFF_ID_PREFIX}${paddedNumber}`;
  });
}

/**
 * Create a new staff member
 * @param payload Staff data
 * @param fingerprintTemplateId The fingerprint template ID
 * @param customStaffId Optional custom staff ID (if not provided, one will be generated)
 */
export async function createStaff(payload: CreateStaffPayload, fingerprintTemplateId: string, customStaffId?: string): Promise<Staff> {
  // Use custom staffId if provided, otherwise generate one
  const id = customStaffId || await generateStaffId();
  
  const staff: Staff = {
    id,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    department: payload.department.trim(),
    role: payload.role.trim(),
    hourlyRate: payload.hourlyRate ?? APP_CONSTANTS.DEFAULT_HOURLY_RATE,
    fingerprintTemplateId,
    createdAt: new Date(),
    isActive: true
  };

  await db.staff.add(staff);
  return staff;
}

/**
 * Get all staff members
 */
export async function getAllStaff(): Promise<Staff[]> {
  return await db.staff.orderBy('createdAt').reverse().toArray();
}

/**
 * Get active staff members only
 */
export async function getActiveStaff(): Promise<Staff[]> {
  return await db.staff.where('isActive').equals(1).toArray();
}

/**
 * Get staff by ID
 */
export async function getStaffById(id: string): Promise<Staff | undefined> {
  return await db.staff.get(id);
}

/**
 * Get staff by fingerprint template ID
 */
export async function getStaffByFingerprintId(fingerprintTemplateId: string): Promise<Staff | undefined> {
  return await db.staff.filter((s: Staff) => s.fingerprintTemplateId === fingerprintTemplateId).first();
}

/**
 * Update staff member
 */
export async function updateStaff(payload: UpdateStaffPayload): Promise<Staff | undefined> {
  const existing = await db.staff.get(payload.id);
  if (!existing) {
    throw new Error(`Staff with ID ${payload.id} not found`);
  }

  const updates: Partial<Staff> = {};
  if (payload.firstName !== undefined) updates.firstName = payload.firstName.trim();
  if (payload.lastName !== undefined) updates.lastName = payload.lastName.trim();
  if (payload.department !== undefined) updates.department = payload.department.trim();
  if (payload.role !== undefined) updates.role = payload.role.trim();
  if (payload.hourlyRate !== undefined) updates.hourlyRate = payload.hourlyRate;
  if (payload.isActive !== undefined) updates.isActive = payload.isActive;

  await db.staff.update(payload.id, updates);
  return await db.staff.get(payload.id);
}

/**
 * Deactivate staff (soft delete)
 */
export async function deactivateStaff(id: string): Promise<void> {
  await db.staff.update(id, { isActive: false });
}

/**
 * Reactivate staff
 */
export async function reactivateStaff(id: string): Promise<void> {
  await db.staff.update(id, { isActive: true });
}

/**
 * Get staff by department
 */
export async function getStaffByDepartment(department: string): Promise<Staff[]> {
  return await db.staff.where('department').equals(department).toArray();
}

/**
 * Get all unique departments
 */
export async function getAllDepartments(): Promise<string[]> {
  const staff = await db.staff.toArray();
  const departments = new Set<string>(staff.map((s: Staff) => s.department));
  return Array.from(departments).sort();
}

/**
 * Get staff count
 */
export async function getStaffCount(): Promise<number> {
  return await db.staff.count();
}

/**
 * Get active staff count
 */
export async function getActiveStaffCount(): Promise<number> {
  return await db.staff.where('isActive').equals(1).count();
}

/**
 * Search staff by name
 */
export async function searchStaffByName(query: string): Promise<Staff[]> {
  const lowerQuery = query.toLowerCase();
  return await db.staff
    .filter((staff: Staff) => 
      staff.firstName.toLowerCase().includes(lowerQuery) ||
      staff.lastName.toLowerCase().includes(lowerQuery) ||
      `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}
