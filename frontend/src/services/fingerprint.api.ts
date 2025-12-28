import {
  FingerprintEnrollResponse,
  FingerprintVerifyResponse,
  FingerprintServiceStatus,
  APP_CONSTANTS
} from '../types';

const FINGERPRINT_SERVICE_URL = APP_CONSTANTS.FINGERPRINT_SERVICE_URL;

/**
 * Fingerprint Service API Client
 * Communicates with the local Node.js fingerprint service
 */
class FingerprintApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = FINGERPRINT_SERVICE_URL;
  }

  /**
   * Check if the fingerprint service is running and device is ready
   */
  async checkStatus(): Promise<FingerprintServiceStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/fingerprint/device-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fingerprint service not responding');
      }

      const data = await response.json();
      return {
        connected: data.connected,
        deviceReady: data.deviceReady,
        message: data.message
      };
    } catch (error) {
      console.error('Failed to check fingerprint service status:', error);
      return {
        connected: false,
        deviceReady: false,
        message: 'Cannot connect to fingerprint service. Please ensure the local service is running.'
      };
    }
  }

  /**
   * Enroll a new fingerprint for a staff member
   */
  async enrollFingerprint(staffId: string): Promise<FingerprintEnrollResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/fingerprint/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ staffId })
      });

      const data = await response.json();

      return {
        success: data.success,
        templateId: data.templateId,
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('Failed to enroll fingerprint:', error);
      return {
        success: false,
        templateId: null,
        message: 'Failed to connect to fingerprint service',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify a fingerprint for clock-in/clock-out/login
   */
  async verifyFingerprint(action: 'clock-in' | 'clock-out' | 'login'): Promise<FingerprintVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/fingerprint/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      return {
        success: data.success,
        matched: data.matched,
        staffId: data.staffId,
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('Failed to verify fingerprint:', error);
      return {
        success: false,
        matched: false,
        staffId: null,
        message: 'Failed to connect to fingerprint service',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check ping
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health/ping`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const fingerprintApi = new FingerprintApiService();
