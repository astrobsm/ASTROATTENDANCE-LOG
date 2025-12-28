# AstroBSM Attendance Log

A fingerprint-based attendance, payroll, and payslip management system built with React, TypeScript, and DigitalPersona SDK integration.

## Features

- 🔐 **Fingerprint Authentication** - Secure login and clock-in/out using DigitalPersona U.are.U 4500
- 👥 **Staff Management** - Register and manage employees with fingerprint enrollment
- ⏰ **Attendance Tracking** - Real-time clock-in/out with fingerprint verification
- 💰 **Payroll Generation** - Automatic payroll calculation based on attendance
- 📄 **Payslip Generation** - Generate and download PDF payslips
- 📊 **Dashboard Analytics** - Visual reports and attendance statistics
- 💾 **Offline Support** - PWA with IndexedDB for offline functionality

## System Requirements

### For Users (Workstations)
- Windows 10/11 (64-bit)
- DigitalPersona U.are.U 4500 Fingerprint Reader
- Modern web browser (Chrome, Edge, Firefox)
- Node.js 18+ (for local fingerprint service)
- .NET 6.0 Runtime

### For Deployment
- Vercel account (for frontend hosting)
- GitHub account (for source control)

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/astrobsm/ASTROATTENDANCE-LOG.git
cd ASTROATTENDANCE-LOG
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Install Fingerprint Service Dependencies
```bash
cd ../fingerprint-service
npm install
```

### 4. Build the Native Helper
```bash
cd native
dotnet build -c Release
```

### 5. Start the Services
```bash
# Terminal 1 - Fingerprint Service
cd fingerprint-service
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access the Application
Open http://localhost:3000 in your browser.

## Deployment

### Vercel Deployment (Frontend)
1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

### Local Fingerprint Service
The fingerprint service must run locally on each workstation:

1. Install DigitalPersona U.are.U Runtime
2. Install .NET 6.0 Runtime
3. Run the fingerprint service on port 5000
4. Connect the U.are.U 4500 device

## Project Structure

```
ASTROATTENDANCE-LOG/
├── frontend/                 # React frontend (deployed to Vercel)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   ├── database/        # IndexedDB operations
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── fingerprint-service/     # Local Node.js service
│   ├── src/                 # Express server
│   └── native/              # .NET fingerprint helper
└── DP_UareU_WSDK_223/       # DigitalPersona SDK
```

## API Endpoints

### Fingerprint Service (localhost:5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/status` | Service health check |
| GET | `/fingerprint/device-status` | Check device connection |
| POST | `/fingerprint/enroll` | Enroll new fingerprint |
| POST | `/fingerprint/verify` | Verify fingerprint |
| GET | `/fingerprint/templates` | List enrolled templates |

## Default Credentials

- **Admin Username:** `admin`
- **Admin Password:** `astrobsm2024`

## License

Proprietary - AstroBSM © 2024

## Support

For support, contact: support@astrobsm.com
