import express from 'express';
import cors from 'cors';
import { fingerprintRouter } from './routes/fingerprint.routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - only allow localhost origins
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/fingerprint', fingerprintRouter);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     AstroBSM Fingerprint Service                          ║
║     DigitalPersona U.are.U 4500 Integration               ║
║                                                            ║
║     Server running on http://localhost:${PORT}              ║
║                                                            ║
║     Endpoints:                                             ║
║     - GET  /health/status                                  ║
║     - POST /fingerprint/enroll                             ║
║     - POST /fingerprint/verify                             ║
║     - GET  /fingerprint/device-status                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
