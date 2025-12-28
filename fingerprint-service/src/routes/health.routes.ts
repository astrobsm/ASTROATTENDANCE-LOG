import { Router, Request, Response } from 'express';
import { DigitalPersonaService } from '../services/digitalPersona.service';

const router = Router();
const digitalPersonaService = new DigitalPersonaService();

/**
 * GET /health/status
 * Check overall service health
 */
router.get('/status', (req: Request, res: Response) => {
  const deviceStatus = digitalPersonaService.getDeviceStatus();
  
  res.json({
    success: true,
    service: 'AstroBSM Fingerprint Service',
    version: '1.0.0',
    status: 'running',
    device: deviceStatus,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ping
 * Simple ping endpoint
 */
router.get('/ping', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
