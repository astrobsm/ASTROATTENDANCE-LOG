// Re-export all types from a single entry point
export * from './staff.types';
export * from './attendance.types';
export * from './payroll.types';
export * from './payslip.types';
export * from './fingerprint.types';

/**
 * Application-wide constants
 */
export const APP_CONSTANTS = {
  EMPLOYER_NAME: 'ASTROBSM',
  DEFAULT_HOURLY_RATE: 425,
  STAFF_ID_PREFIX: 'ASTRO-EMP-',
  FINGERPRINT_SERVICE_URL: import.meta.env.VITE_FINGERPRINT_SERVICE_URL || 'http://localhost:5000',
} as const;

/**
 * User roles for access control
 */
export type UserRole = 'admin' | 'staff';

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  staffId: string | null;
  staffName: string | null;
  loading?: boolean;
}

/**
 * Navigation items
 */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}
