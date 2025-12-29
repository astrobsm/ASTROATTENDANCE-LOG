@echo off
REM ============================================================
REM AstroBSM Attendance Log - Fingerprint Service Installer
REM Run this script as Administrator on each computer with
REM a DigitalPersona U.are.U 4500 fingerprint device
REM ============================================================

title AstroBSM Fingerprint Service Installer
color 0A

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                                                            ║
echo  ║     AstroBSM Attendance Log - Setup Wizard                ║
echo  ║     Fingerprint Device Configuration                       ║
echo  ║                                                            ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator!
    echo Right-click the file and select "Run as administrator"
    pause
    exit /b 1
)

echo [Step 1/5] Checking system requirements...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Node.js not found. Installing...
    echo.
    echo Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'"
    echo Installing Node.js...
    msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
    del "%TEMP%\nodejs.msi"
    echo [OK] Node.js installed
    
    REM Refresh PATH
    set "PATH=%PATH%;C:\Program Files\nodejs"
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js %%i found
)

echo.
echo [Step 2/5] Checking .NET Runtime...
echo.

REM Check if .NET 6.0 is installed
dotnet --list-runtimes 2>nul | findstr "Microsoft.NETCore.App 6" >nul
if %errorLevel% neq 0 (
    echo [!] .NET 6.0 Runtime not found. Installing...
    echo.
    winget install Microsoft.DotNet.Runtime.6 --accept-source-agreements --accept-package-agreements
    echo [OK] .NET 6.0 Runtime installed
) else (
    echo [OK] .NET 6.0 Runtime found
)

echo.
echo [Step 3/5] Checking DigitalPersona drivers...
echo.

REM Check if DigitalPersona RTE is installed
if exist "C:\Program Files\DigitalPersona\U.are.U RTE" (
    echo [OK] DigitalPersona U.are.U RTE found
) else (
    echo [!] DigitalPersona drivers not found.
    echo.
    echo Please install the DigitalPersona U.are.U Runtime Environment:
    echo.
    echo   Option 1: Run the installer from the SDK folder:
    echo   DP_UareU_WSDK_223\RTE\x64\setup.exe
    echo.
    echo   Option 2: Download from DigitalPersona website
    echo.
    echo Press any key after installing the drivers...
    pause >nul
)

echo.
echo [Step 4/5] Setting up fingerprint service...
echo.

REM Create service directory
set "SERVICE_DIR=%LOCALAPPDATA%\AstroBSM\fingerprint-service"
if not exist "%SERVICE_DIR%" mkdir "%SERVICE_DIR%"

REM Copy service files (assumes this script is in the installers folder)
set "SCRIPT_DIR=%~dp0"
set "SOURCE_DIR=%SCRIPT_DIR%..\fingerprint-service"

if exist "%SOURCE_DIR%" (
    echo Copying fingerprint service files...
    xcopy /E /I /Y "%SOURCE_DIR%\*" "%SERVICE_DIR%\" >nul
    echo [OK] Service files copied to %SERVICE_DIR%
    
    cd /d "%SERVICE_DIR%"
    
    echo Installing dependencies...
    call npm install --production >nul 2>&1
    echo [OK] Dependencies installed
) else (
    echo [!] Fingerprint service source not found at %SOURCE_DIR%
    echo Please ensure you have the complete AstroBSM installation files.
)

echo.
echo [Step 5/5] Creating startup shortcut...
echo.

REM Create a startup script
echo @echo off > "%SERVICE_DIR%\start-service.bat"
echo title AstroBSM Fingerprint Service >> "%SERVICE_DIR%\start-service.bat"
echo cd /d "%SERVICE_DIR%" >> "%SERVICE_DIR%\start-service.bat"
echo node dist\index.js >> "%SERVICE_DIR%\start-service.bat"

REM Create desktop shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\AstroBSM Fingerprint Service.lnk'); $Shortcut.TargetPath = '%SERVICE_DIR%\start-service.bat'; $Shortcut.WorkingDirectory = '%SERVICE_DIR%'; $Shortcut.IconLocation = 'shell32.dll,43'; $Shortcut.Save()"

echo [OK] Desktop shortcut created

REM Create startup entry (optional)
echo.
set /p AUTOSTART="Do you want the service to start automatically with Windows? (Y/N): "
if /i "%AUTOSTART%"=="Y" (
    copy "%SERVICE_DIR%\start-service.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\" >nul
    echo [OK] Added to Windows startup
)

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                                                            ║
echo  ║     Installation Complete!                                 ║
echo  ║                                                            ║
echo  ║     To use the system:                                     ║
echo  ║     1. Double-click "AstroBSM Fingerprint Service"         ║
echo  ║        on your desktop to start the service                ║
echo  ║     2. Open https://astroattendance-log.vercel.app         ║
echo  ║     3. Connect your U.are.U 4500 fingerprint device        ║
echo  ║                                                            ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

set /p STARTNOW="Start the fingerprint service now? (Y/N): "
if /i "%STARTNOW%"=="Y" (
    start "" "%SERVICE_DIR%\start-service.bat"
    echo.
    echo Service started! Opening web app...
    timeout /t 3 >nul
    start "" "https://astroattendance-log.vercel.app"
)

echo.
echo Press any key to exit...
pause >nul
