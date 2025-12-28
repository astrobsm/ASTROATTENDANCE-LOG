import express from 'express';
import cors from 'cors';
import { fingerprintRouter } from './routes/fingerprint.routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow Vercel hosted app and localhost
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://astroattendance-log.vercel.app',
    /https:\/\/astroattendance.*\.vercel\.app$/
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
const server = app.listen(Number(PORT), '0.0.0.0', () => {
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

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close other applications using this port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nShutting down fingerprint service...');
  server.close(() => {
    process.exit(0);
  });
});

// Prevent the process from exiting
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
