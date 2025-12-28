import { Router, Request, Response } from 'express';
import { digitalPersonaService } from '../services/digitalPersonaSDK.service';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /fingerprint/enroll
 * Enroll a new fingerprint for a staff member
 * Body: { staffId: string }
 */
router.post('/enroll', asyncHandler(async (req: Request, res: Response) => {
  const { staffId } = req.body;

  if (!staffId) {
    return res.status(400).json({
      success: false,
      error: 'Staff ID is required',
      templateId: null,
      message: 'Enrollment failed: Missing staff ID'
    });
  }

  console.log(`Starting fingerprint enrollment for staff: ${staffId}`);

  const result = await digitalPersonaService.enrollFingerprint(staffId);

  if (result.success) {
    res.json({
      success: true,
      templateId: result.templateId,
      message: result.message
    });
  } else {
    res.status(400).json({
      success: false,
      templateId: null,
      message: result.message,
      error: result.error
    });
  }
}));

/**
 * POST /fingerprint/verify
 * Verify a fingerprint and return matching staff ID (identify mode)
 * Body: { action: 'clock-in' | 'clock-out' | 'login' }
 */
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const { action } = req.body;

  if (!action || !['clock-in', 'clock-out', 'login'].includes(action)) {
    return res.status(400).json({
      success: false,
      matched: false,
      staffId: null,
      message: 'Invalid action. Must be "clock-in", "clock-out", or "login"'
    });
  }

  console.log(`Starting fingerprint identification for action: ${action}`);

  // Use identify (1:N matching) for clock in/out
  const result = await digitalPersonaService.identifyFingerprint();

  if (result.success && result.matched) {
    res.json({
      success: true,
      matched: true,
      staffId: result.staffId,
      message: `Fingerprint verified successfully for ${action}`
    });
  } else {
    // Return success:true but matched:false when no match found (not an error)
    res.json({
      success: true,
      matched: false,
      staffId: null,
      message: result.message || 'No matching fingerprint found',
      error: result.error
    });
  }
}));

/**
 * GET /fingerprint/device-status
 * Get the current status of the fingerprint device
 */
router.get('/device-status', asyncHandler(async (req: Request, res: Response) => {
  const status = await digitalPersonaService.getDeviceStatus();
  
  res.json({
    success: true,
    ...status,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /fingerprint/templates
 * List all enrolled fingerprint templates
 */
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  const result = await digitalPersonaService.listTemplates();
  
  res.json({
    success: true,
    ...result
  });
}));

/**
 * DELETE /fingerprint/template/:staffId
 * Delete a fingerprint template by staff ID
 */
router.delete('/template/:staffId', asyncHandler(async (req: Request, res: Response) => {
  const { staffId } = req.params;

  if (!staffId) {
    return res.status(400).json({
      success: false,
      message: 'Staff ID is required'
    });
  }

  const result = await digitalPersonaService.deleteTemplate(staffId);

  res.json({
    success: result.success,
    message: result.message
  });
}));

export { router as fingerprintRouter };
