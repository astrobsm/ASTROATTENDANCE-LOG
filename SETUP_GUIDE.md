# AstroBSM Attendance Log - Multi-Computer Setup Guide

## 🖥️ Deploying to Other Computers

### What You Need on EACH Computer

The AstroBSM Attendance Log works in a **hybrid mode**:
- **Web App**: Hosted on Vercel (no installation needed - works in browser)
- **Fingerprint Service**: Must run locally on each computer with a fingerprint device

### Requirements per Computer

| Component | Why It's Needed | How to Get It |
|-----------|----------------|---------------|
| **Web Browser** | Chrome, Edge, or Firefox (latest) | Built-in on Windows |
| **DigitalPersona U.are.U RTE** | Drivers for the fingerprint device | `DP_UareU_WSDK_223\RTE\x64\setup.exe` |
| **Node.js 18+** | Runs the fingerprint service | [nodejs.org](https://nodejs.org) |
| **.NET 6.0 Runtime** | Native fingerprint helper | [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/6.0) |
| **Fingerprint Service** | Bridges web app to device | Included in this repo |

---

## 🚀 Quick Setup (Recommended)

### Step 1: Run the Installer
```batch
# Run as Administrator
installers\setup-fingerprint-service.bat
```

This will:
✅ Check and install Node.js if missing
✅ Check and install .NET 6.0 if missing
✅ Copy fingerprint service files
✅ Create a desktop shortcut
✅ Optionally add to Windows startup

### Step 2: Install DigitalPersona Drivers (if not installed)
```batch
# Run as Administrator
DP_UareU_WSDK_223\RTE\x64\setup.exe
```
> ⚠️ Restart the computer after installing drivers

### Step 3: Connect Device & Start Service
1. Plug in the U.are.U 4500 fingerprint device (LED should turn blue)
2. Double-click "AstroBSM Fingerprint Service" on desktop
3. Keep the service window open

### Step 4: Open the Web App
Go to: **https://astroattendance-log.vercel.app**

---

## 🌐 Online vs Offline Mode

### How It Works

| Feature | Online | Offline |
|---------|--------|---------|
| Login | ✅ Works | ✅ Works (cached) |
| View Dashboard | ✅ Works | ✅ Works (local data) |
| Clock In/Out | ✅ Syncs to cloud | ✅ Saves locally, syncs later |
| Register Staff | ✅ Syncs to cloud | ✅ Saves locally |
| Fingerprint Scan | ✅ Works | ✅ Works (requires local service) |
| View Attendance History | ✅ All data | ✅ Local data only |
| Generate Payroll | ✅ Full data | ✅ Local data only |

### Data Storage
- **Local (IndexedDB)**: All data is stored locally in your browser
- **Cloud (Vercel Postgres)**: Data syncs to cloud when online
- **Automatic Sync**: When you come back online, local changes sync to cloud

### First-Time Setup on New Computer
1. Open the app while online (downloads and caches all assets)
2. The app will work offline after that

---

## 📁 What to Copy to Each Computer

For a minimal setup, copy these files:

```
fingerprint-service/
├── dist/               # Compiled TypeScript
├── native/bin/Release/ # .NET fingerprint helper
├── package.json
└── node_modules/       # (or run npm install)

installers/
└── setup-fingerprint-service.bat
```

---

## 🔧 Manual Setup (Advanced)

If the installer doesn't work, follow these steps:

### 1. Install Node.js
Download and install from https://nodejs.org (LTS version)

### 2. Install .NET 6.0 Runtime
```powershell
winget install Microsoft.DotNet.Runtime.6
```

### 3. Install DigitalPersona Drivers
Run `DP_UareU_WSDK_223\RTE\x64\setup.exe` as Administrator

### 4. Setup Fingerprint Service
```powershell
cd fingerprint-service
npm install
npm run build
```

### 5. Start the Service
```powershell
cd fingerprint-service
node dist/index.js
```

### 6. Open Web App
Navigate to https://astroattendance-log.vercel.app

---

## ❓ Troubleshooting

### "Fingerprint service not available"
- Make sure the fingerprint service is running (command prompt window open)
- Check if port 5000 is not blocked by firewall

### "Device not found"
- Ensure the U.are.U 4500 is plugged in (blue LED = powered)
- Reinstall DigitalPersona drivers
- Try a different USB port

### "Capture timeout" or finger not reading
- Clean the sensor surface
- Press finger firmly and flat on the scanner
- The service uses EXCLUSIVE mode to prevent conflicts with other software

### App not loading offline
- Visit the app once while online to cache it
- Clear browser cache and revisit if issues persist

---

## 📞 Support

- **App URL**: https://astroattendance-log.vercel.app
- **GitHub**: https://github.com/astrobsm/ASTROATTENDANCE-LOG

---

## 🔐 Default Admin Credentials

- **Username**: `admin`
- **Password**: `astrobsm2024`

> ⚠️ Change the password after first login!
