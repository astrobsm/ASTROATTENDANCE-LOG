import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '../common';
import { fingerprintService } from '../../services';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [checking, setChecking] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'running' | 'not-running'>('unknown');
  const [deviceStatus, setDeviceStatus] = useState<'unknown' | 'connected' | 'not-connected'>('unknown');

  const checkService = async () => {
    setChecking(true);
    try {
      const status = await fingerprintService.checkStatus();
      if (status.connected) {
        setServiceStatus('running');
        setDeviceStatus(status.deviceReady ? 'connected' : 'not-connected');
        if (status.deviceReady) {
          onComplete();
        }
      } else {
        setServiceStatus('running');
        setDeviceStatus('not-connected');
      }
    } catch {
      setServiceStatus('not-running');
      setDeviceStatus('unknown');
    }
    setChecking(false);
  };

  useEffect(() => {
    checkService();
    // Check every 5 seconds
    const interval = setInterval(checkService, 5000);
    return () => clearInterval(interval);
  }, []);

  const downloadInstaller = () => {
    // Create and download the installer batch file
    const installerContent = `@echo off
echo =====================================================
echo    AstroBSM Attendance Log - Setup Installer
echo    DigitalPersona Fingerprint Integration
echo =====================================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this installer as Administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [Step 1/4] Checking prerequisites...
echo.

REM Check if .NET 6.0 is installed
dotnet --list-runtimes 2>nul | findstr "Microsoft.NETCore.App 6" >nul
if %errorLevel% neq 0 (
    echo .NET 6.0 Runtime not found. Installing...
    echo Downloading .NET 6.0 Runtime...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile '%TEMP%\\dotnet-install.ps1'}"
    powershell -ExecutionPolicy Bypass -File "%TEMP%\\dotnet-install.ps1" -Channel 6.0 -Runtime dotnet
    echo .NET 6.0 installed successfully!
) else (
    echo .NET 6.0 Runtime is already installed.
)
echo.

echo [Step 2/4] Checking DigitalPersona Runtime...
echo.
if exist "C:\\Program Files\\DigitalPersona\\U.are.U RTE" (
    echo DigitalPersona Runtime is already installed.
) else (
    echo DigitalPersona Runtime not found!
    echo.
    echo Please install the DigitalPersona U.are.U Runtime:
    echo 1. Contact your IT administrator for the installer
    echo 2. Or download from DigitalPersona/HID Global website
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)
echo.

echo [Step 3/4] Setting up Fingerprint Service...
echo.
set SERVICE_PATH=%LOCALAPPDATA%\\AstroBSM\\fingerprint-service
if not exist "%SERVICE_PATH%" mkdir "%SERVICE_PATH%"

echo Fingerprint service directory: %SERVICE_PATH%
echo.

echo [Step 4/4] Creating service launcher...
echo.

REM Create a launcher script
echo @echo off > "%SERVICE_PATH%\\start-service.bat"
echo cd /d "%SERVICE_PATH%" >> "%SERVICE_PATH%\\start-service.bat"
echo npm run dev >> "%SERVICE_PATH%\\start-service.bat"

echo =====================================================
echo    Setup Complete!
echo =====================================================
echo.
echo To use the AstroBSM Attendance Log with fingerprint:
echo 1. Connect your DigitalPersona U.are.U 4500 device
echo 2. Open the AstroBSM web application
echo 3. The fingerprint service will start automatically
echo.
echo Press any key to exit...
pause >nul
`;

    const blob = new Blob([installerContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AstroBSM-Setup.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadServicePackage = () => {
    // Redirect to GitHub releases page for the service package
    window.open('https://github.com/astrobsm/ASTROATTENDANCE-LOG/releases', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fingerprint Setup Required</h1>
          <p className="text-gray-600">
            To use fingerprint authentication, you need to set up the local fingerprint service on this computer.
          </p>
        </div>

        {checking ? (
          <div className="flex flex-col items-center py-8">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Checking fingerprint service status...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Status */}
              <div className={`p-4 rounded-lg border-2 ${
                serviceStatus === 'running' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    serviceStatus === 'running' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">Fingerprint Service</p>
                    <p className={`text-sm ${
                      serviceStatus === 'running' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {serviceStatus === 'running' ? 'Running' : 'Not Running'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Status */}
              <div className={`p-4 rounded-lg border-2 ${
                deviceStatus === 'connected' 
                  ? 'border-green-500 bg-green-50' 
                  : deviceStatus === 'not-connected'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    deviceStatus === 'connected' 
                      ? 'bg-green-500' 
                      : deviceStatus === 'not-connected'
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">Fingerprint Device</p>
                    <p className={`text-sm ${
                      deviceStatus === 'connected' 
                        ? 'text-green-600' 
                        : deviceStatus === 'not-connected'
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                    }`}>
                      {deviceStatus === 'connected' 
                        ? 'Connected' 
                        : deviceStatus === 'not-connected'
                        ? 'Not Connected'
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Instructions */}
            {serviceStatus === 'not-running' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Setup Instructions</h3>
                <ol className="list-decimal list-inside space-y-3 text-blue-800">
                  <li>
                    <strong>Install DigitalPersona Runtime</strong>
                    <p className="ml-6 text-sm text-blue-600">
                      Download and install the DigitalPersona U.are.U Runtime Environment
                    </p>
                  </li>
                  <li>
                    <strong>Install .NET 6.0 Runtime</strong>
                    <p className="ml-6 text-sm text-blue-600">
                      Required for the fingerprint helper application
                    </p>
                  </li>
                  <li>
                    <strong>Download Fingerprint Service</strong>
                    <p className="ml-6 text-sm text-blue-600">
                      Get the local service package from our releases page
                    </p>
                  </li>
                  <li>
                    <strong>Connect the Device</strong>
                    <p className="ml-6 text-sm text-blue-600">
                      Plug in your DigitalPersona U.are.U 4500 fingerprint reader
                    </p>
                  </li>
                  <li>
                    <strong>Start the Service</strong>
                    <p className="ml-6 text-sm text-blue-600">
                      Run the fingerprint service on port 5000
                    </p>
                  </li>
                </ol>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={downloadInstaller} variant="primary">
                    Download Installer Script
                  </Button>
                  <Button onClick={downloadServicePackage} variant="secondary">
                    Get Service Package
                  </Button>
                  <Button onClick={checkService} variant="outline">
                    Refresh Status
                  </Button>
                </div>
              </div>
            )}

            {serviceStatus === 'running' && deviceStatus === 'not-connected' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-2">Device Not Detected</h3>
                <p className="text-yellow-800 mb-4">
                  The fingerprint service is running but no device is connected. Please:
                </p>
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  <li>Connect your DigitalPersona U.are.U 4500 device</li>
                  <li>Make sure the device LED lights up</li>
                  <li>Check Device Manager for driver issues</li>
                </ul>
                <Button onClick={checkService} variant="primary" className="mt-4">
                  Check Again
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button onClick={onSkip} variant="ghost">
                Skip for Now (Admin Only)
              </Button>
              {serviceStatus === 'running' && deviceStatus === 'connected' && (
                <Button onClick={onComplete} variant="primary">
                  Continue to App
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SetupWizard;
