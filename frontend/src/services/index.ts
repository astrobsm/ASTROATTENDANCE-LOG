import { fingerprintApi } from './fingerprint.api';

// Export API client
export { fingerprintApi };
export { generatePayslipPDF, generatePayslipDataURL } from './payslip.generator';

/**
 * Fingerprint Service - simplified interface for components
 */
export const fingerprintService = {
  /**
   * Enroll a new fingerprint for a staff member
   */
  async enrollFingerprint(staffId: string) {
    const result = await fingerprintApi.enrollFingerprint(staffId);
    return {
      success: result.success,
      templateId: result.templateId,
      message: result.message,
      error: result.error
    };
  },

  /**
   * Verify fingerprint for login
   */
  async verifyFingerprint() {
    const result = await fingerprintApi.verifyFingerprint('login');
    return {
      success: result.matched === true, // Only success if matched
      staffId: result.staffId,
      staffName: result.staffName,
      error: result.matched ? undefined : (result.message || 'Fingerprint not recognized')
    };
  },

  /**
   * Verify fingerprint for clock in/out
   */
  async verifyForClockAction(action: 'clock-in' | 'clock-out') {
    const result = await fingerprintApi.verifyFingerprint(action);
    return {
      success: result.matched === true,
      staffId: result.staffId,
      staffName: result.staffName,
      message: result.message,
      error: result.matched ? undefined : (result.message || 'Fingerprint not recognized')
    };
  },

  /**
   * Check service status
   */
  async checkStatus() {
    return await fingerprintApi.checkStatus();
  },

  /**
   * Ping health check
   */
  async ping() {
    return await fingerprintApi.ping();
  }
};
