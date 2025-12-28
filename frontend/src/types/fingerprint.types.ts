/**
 * Fingerprint service response types
 */

export interface FingerprintEnrollResponse {
  success: boolean;
  templateId: string | null;
  message: string;
  error?: string;
}

export interface FingerprintVerifyResponse {
  success: boolean;
  matched: boolean;
  staffId: string | null;
  staffName?: string | null;
  message: string;
  error?: string;
}

export interface FingerprintServiceStatus {
  connected: boolean;
  deviceReady: boolean;
  message: string;
}

/**
 * Fingerprint enrollment request
 */
export interface FingerprintEnrollRequest {
  staffId: string;
}

/**
 * Fingerprint verification request
 */
export interface FingerprintVerifyRequest {
  action: 'clock-in' | 'clock-out';
}
