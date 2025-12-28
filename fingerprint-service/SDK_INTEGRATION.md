# DigitalPersona U.are.U SDK Integration

This document explains how to set up the DigitalPersona U.are.U 4500 fingerprint device with the AstroBSM Attendance Log application.

## SDK Location

The SDK is located at: `E:\astroattendance log\DP_UareU_WSDK_223`

## Prerequisites

1. **Windows 10/11 (64-bit)**
2. **.NET 6.0 Runtime** - [Download](https://dotnet.microsoft.com/download/dotnet/6.0)
3. **DigitalPersona U.are.U 4500 Fingerprint Reader**

## Installation Steps

### Step 1: Install DigitalPersona Runtime Environment

1. Navigate to `E:\astroattendance log\DP_UareU_WSDK_223\RTE\x64`
2. Run `setup.exe` as Administrator
3. Follow the installation wizard
4. Restart your computer when prompted

### Step 2: Install DigitalPersona SDK

1. Navigate to `E:\astroattendance log\DP_UareU_WSDK_223\SDK\x64`
2. Run `setup.exe` as Administrator
3. Follow the installation wizard
4. This installs the development libraries and drivers

### Step 3: Connect the Fingerprint Device

1. Plug in the U.are.U 4500 USB fingerprint reader
2. Windows should automatically install the drivers
3. The device LED should light up (usually blue or green)

### Step 4: Build the Native Helper

```powershell
cd "E:\astroattendance log\fingerprint-service\native"
dotnet restore
dotnet build -c Release
```

This creates `FingerprintHelper.exe` which bridges Node.js with the DigitalPersona SDK.

### Step 5: Start the Fingerprint Service

```powershell
cd "E:\astroattendance log\fingerprint-service"
npm install
npm run dev
```

The service will start on `http://localhost:5000`

## Testing the Integration

### Check Device Status

```powershell
curl http://localhost:5000/fingerprint/device-status
```

Expected response:
```json
{
  "success": true,
  "connected": true,
  "deviceReady": true,
  "deviceName": "DigitalPersona U.are.U 4500",
  "message": "Device is ready for fingerprint capture"
}
```

### Enroll a Fingerprint

```powershell
curl -X POST http://localhost:5000/fingerprint/enroll `
  -H "Content-Type: application/json" `
  -d '{"staffId": "ASTRO-EMP-001"}'
```

The device will prompt for 4 fingerprint captures.

### Identify/Verify a Fingerprint

```powershell
curl -X POST http://localhost:5000/fingerprint/verify `
  -H "Content-Type: application/json" `
  -d '{"action": "clock-in"}'
```

## Simulation Mode

If the native helper is not built or the SDK is not installed, the service runs in **simulation mode**:
- Device appears as connected
- Enrollment always succeeds
- Verification always matches the first enrolled staff

This allows development and testing without physical hardware.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/status` | Service health check |
| GET | `/fingerprint/device-status` | Check device connection |
| POST | `/fingerprint/enroll` | Enroll new fingerprint |
| POST | `/fingerprint/verify` | Identify fingerprint (1:N matching) |
| GET | `/fingerprint/templates` | List all enrolled templates |
| DELETE | `/fingerprint/template/:staffId` | Delete a template |

## Troubleshooting

### Device Not Detected

1. Check USB connection
2. Try a different USB port
3. Reinstall RTE: `E:\astroattendance log\DP_UareU_WSDK_223\RTE\x64\setup.exe`
4. Check Device Manager for driver issues

### Native Helper Build Errors

Ensure the RTE (Runtime Environment) is installed first. The `DPUruNet.dll` is required:
- Located at: `C:\Program Files\DigitalPersona\U.are.U RTE\Windows\Lib\.NET\DPUruNet.dll`

### Service Won't Start

1. Check if port 5000 is available
2. Run `npm install` in the fingerprint-service folder
3. Ensure Node.js 18+ is installed

## Documentation

- SDK Developer Guide: `E:\astroattendance log\DP_UareU_WSDK_223\Docs\U.are.U_SDK_Developer_Guide.pdf`
- Platform Guide: `E:\astroattendance log\DP_UareU_WSDK_223\Docs\U.are.U_SDK_Platform_Guide_for_Windows.pdf`

## Template Storage

Fingerprint templates are stored at:
```
%LOCALAPPDATA%\AstroBSM\fingerprint-templates\
```

Each staff member has a `.fpt` file containing their encrypted fingerprint template.

## Security Notes

- Fingerprint templates are biometric data and should be protected
- Templates are stored as FMD (Fingerprint Minutiae Data), not raw images
- The actual fingerprint image cannot be reconstructed from FMD data
- In production, consider encrypting the template files
