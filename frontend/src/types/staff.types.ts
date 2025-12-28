/**
 * Staff Model - Represents an employee in the system
 */
export interface Staff {
  id: string;                      // Format: ASTRO-EMP-0001
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  hourlyRate: number;              // Default: 425 Naira
  fingerprintTemplateId: string;   // Stored from DigitalPersona SDK
  createdAt: Date;
  isActive: boolean;
}

/**
 * Staff creation payload (without auto-generated fields)
 */
export interface CreateStaffPayload {
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  hourlyRate?: number;             // Defaults to 425 if not provided
}

/**
 * Staff update payload
 */
export interface UpdateStaffPayload {
  id: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  role?: string;
  hourlyRate?: number;
  isActive?: boolean;
}
