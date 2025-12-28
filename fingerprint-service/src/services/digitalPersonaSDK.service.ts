import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * DigitalPersona SDK Integration Service
 * 
 * This service bridges Node.js with the DigitalPersona U.are.U SDK
 * using a .NET helper application.
 * 
 * SDK Location: E:\astroattendance log\DP_UareU_WSDK_223
 * 
 * Prerequisites:
 * 1. Install DigitalPersona U.are.U SDK from SDK\x64\setup.exe
 * 2. Install Runtime Environment from RTE\x64\setup.exe
 * 3. Connect U.are.U 4500 fingerprint device
 * 4. Build the FingerprintHelper.exe: cd native && dotnet build -c Release
 */

interface CommandResult {
  success: boolean;
  [key: string]: any;
}

interface EnrollResult {
  success: boolean;
  templateId: string | null;
  message: string;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  matched: boolean;
  staffId: string | null;
  message: string;
  error?: string;
}

interface DeviceStatus {
  connected: boolean;
  deviceReady: boolean;
  deviceName: string;
  message: string;
  serialNumber?: string;
}

// Path to the native helper executable
// __dirname is src/services, so we go up 2 levels to fingerprint-service, then into native/bin/Release
const NATIVE_HELPER_PATH = path.join(__dirname, '..', '..', 'native', 'bin', 'Release', 'net6.0-windows', 'win-x64', 'FingerprintHelper.exe');

// Fallback simulation mode when native helper is not available
let simulationMode = false;
const simulatedTemplates = new Map<string, { templateId: string; staffId: string; createdAt: Date }>();

/**
 * Execute the native fingerprint helper
 */
async function executeNativeCommand(command: string, args: string[] = []): Promise<CommandResult> {
  return new Promise((resolve) => {
    try {
      const fullArgs = [command, ...args];
      console.log(`Executing: FingerprintHelper.exe ${fullArgs.join(' ')}`);

      const process = spawn(NATIVE_HELPER_PATH, fullArgs, {
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log progress messages from native helper
        console.log(`[Native] ${data.toString().trim()}`);
      });

      process.on('close', (code) => {
        try {
          if (stdout.trim()) {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } else {
            resolve({
              success: false,
              error: stderr || `Process exited with code ${code}`
            });
          }
        } catch (e) {
          resolve({
            success: false,
            error: `Failed to parse output: ${stdout}`
          });
        }
      });

      process.on('error', (err) => {
        console.error('Failed to execute native helper:', err.message);
        // Fall back to simulation mode
        simulationMode = true;
        resolve({
          success: false,
          error: `Native helper not available: ${err.message}`,
          useSimulation: true
        });
      });

    } catch (error) {
      simulationMode = true;
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        useSimulation: true
      });
    }
  });
}

/**
 * Check if the native helper is available
 */
async function checkNativeHelper(): Promise<boolean> {
  const fs = await import('fs');
  try {
    await fs.promises.access(NATIVE_HELPER_PATH);
    return true;
  } catch {
    return false;
  }
}

class DigitalPersonaSDKService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const nativeAvailable = await checkNativeHelper();
    
    if (!nativeAvailable) {
      console.warn('========================================');
      console.warn('Native fingerprint helper not found!');
      console.warn('Running in SIMULATION MODE');
      console.warn('');
      console.warn('To enable real fingerprint scanning:');
      console.warn('1. Install DigitalPersona SDK from:');
      console.warn('   E:\\astroattendance log\\DP_UareU_WSDK_223\\SDK\\x64\\setup.exe');
      console.warn('2. Install Runtime from:');
      console.warn('   E:\\astroattendance log\\DP_UareU_WSDK_223\\RTE\\x64\\setup.exe');
      console.warn('3. Build the native helper:');
      console.warn('   cd fingerprint-service/native');
      console.warn('   dotnet build -c Release');
      console.warn('========================================');
      simulationMode = true;
    } else {
      console.log('Native fingerprint helper found');
      simulationMode = false;
    }

    this.initialized = true;
  }

  /**
   * Get current device status
   */
  async getDeviceStatus(): Promise<DeviceStatus> {
    if (simulationMode) {
      return {
        connected: true,
        deviceReady: true,
        deviceName: 'DigitalPersona U.are.U 4500 (Simulation)',
        message: 'Running in simulation mode - connect real device for production'
      };
    }

    const result = await executeNativeCommand('status');
    
    if (result.useSimulation) {
      simulationMode = true;
      return this.getDeviceStatus();
    }

    return {
      connected: result.connected ?? false,
      deviceReady: result.deviceReady ?? false,
      deviceName: result.deviceName ?? 'Unknown',
      serialNumber: result.serialNumber,
      message: result.message ?? 'Unknown status'
    };
  }

  /**
   * Enroll a new fingerprint for a staff member
   */
  async enrollFingerprint(staffId: string): Promise<EnrollResult> {
    if (simulationMode) {
      return this.simulateEnrollment(staffId);
    }

    const result = await executeNativeCommand('enroll', [staffId]);

    if (result.useSimulation) {
      simulationMode = true;
      return this.simulateEnrollment(staffId);
    }

    return {
      success: result.success,
      templateId: result.templateId ?? null,
      message: result.message ?? (result.success ? 'Enrolled successfully' : 'Enrollment failed'),
      error: result.error
    };
  }

  /**
   * Verify a fingerprint against a specific staff member
   */
  async verifyFingerprint(staffId: string): Promise<VerifyResult> {
    if (simulationMode) {
      return this.simulateVerification(staffId);
    }

    const result = await executeNativeCommand('verify', [staffId]);

    if (result.useSimulation) {
      simulationMode = true;
      return this.simulateVerification(staffId);
    }

    return {
      success: result.success,
      matched: result.matched ?? false,
      staffId: result.matched ? staffId : null,
      message: result.message ?? (result.matched ? 'Verified' : 'Not matched'),
      error: result.error
    };
  }

  /**
   * Identify a fingerprint against all enrolled templates
   * Used for clock-in/out when staff identity is unknown
   */
  async identifyFingerprint(): Promise<VerifyResult> {
    if (simulationMode) {
      return this.simulateIdentification();
    }

    const result = await executeNativeCommand('identify');

    if (result.useSimulation) {
      simulationMode = true;
      return this.simulateIdentification();
    }

    return {
      success: result.success,
      matched: result.matched ?? false,
      staffId: result.staffId ?? null,
      message: result.message ?? (result.matched ? 'Identified' : 'Not identified'),
      error: result.error
    };
  }

  /**
   * Delete a staff member's fingerprint template
   */
  async deleteTemplate(staffId: string): Promise<{ success: boolean; message: string }> {
    if (simulationMode) {
      simulatedTemplates.delete(staffId);
      return { success: true, message: 'Template deleted (simulation)' };
    }

    const result = await executeNativeCommand('delete', [staffId]);
    return {
      success: result.success,
      message: result.message ?? 'Operation completed'
    };
  }

  /**
   * List all enrolled templates
   */
  async listTemplates(): Promise<{ count: number; templates: any[] }> {
    if (simulationMode) {
      return {
        count: simulatedTemplates.size,
        templates: Array.from(simulatedTemplates.values())
      };
    }

    const result = await executeNativeCommand('list');
    return {
      count: result.count ?? 0,
      templates: result.templates ?? []
    };
  }

  // ============ Simulation Methods ============

  private simulateEnrollment(staffId: string): EnrollResult {
    // Check if already enrolled
    if (simulatedTemplates.has(staffId)) {
      return {
        success: false,
        templateId: null,
        message: 'Staff member already has a registered fingerprint',
        error: 'ALREADY_ENROLLED'
      };
    }

    const templateId = `FP-SIM-${uuidv4()}`;
    
    simulatedTemplates.set(staffId, {
      templateId,
      staffId,
      createdAt: new Date()
    });

    console.log(`[Simulation] Enrolled fingerprint for staff: ${staffId}`);

    return {
      success: true,
      templateId,
      message: 'Fingerprint enrolled successfully (simulation mode)'
    };
  }

  private simulateVerification(staffId: string): VerifyResult {
    const template = simulatedTemplates.get(staffId);

    if (!template) {
      return {
        success: true,
        matched: false,
        staffId: null,
        message: 'Staff member does not have a registered fingerprint'
      };
    }

    // In simulation, always match if enrolled
    console.log(`[Simulation] Verified fingerprint for staff: ${staffId}`);
    
    return {
      success: true,
      matched: true,
      staffId,
      message: 'Fingerprint verified successfully (simulation mode)'
    };
  }

  private simulateIdentification(): VerifyResult {
    if (simulatedTemplates.size === 0) {
      return {
        success: true,
        matched: false,
        staffId: null,
        message: 'No fingerprints enrolled in the system'
      };
    }

    // In simulation, return the first enrolled staff
    const firstTemplate = Array.from(simulatedTemplates.values())[0];
    console.log(`[Simulation] Identified as staff: ${firstTemplate.staffId}`);

    return {
      success: true,
      matched: true,
      staffId: firstTemplate.staffId,
      message: 'Fingerprint identified successfully (simulation mode)'
    };
  }
}

// Export singleton instance
export const digitalPersonaService = new DigitalPersonaSDKService();
