@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo    AstroBSM Attendance Log - Fingerprint Setup Installer
echo    DigitalPersona U.are.U 4500 Integration
echo ============================================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this installer as Administrator!
    echo.
    echo Right-click on this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [INFO] Running with administrator privileges...
echo.

REM Create installation directory
set INSTALL_DIR=%LOCALAPPDATA%\AstroBSM
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo [INFO] Installation directory: %INSTALL_DIR%
echo.

REM ============================================================
REM Step 1: Check and Install .NET 6.0 Runtime
REM ============================================================
echo [Step 1/5] Checking .NET 6.0 Runtime...

where dotnet >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] .NET not found. Installing .NET 6.0 Runtime...
    echo.
    
    REM Download .NET 6.0 Runtime installer
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile '%TEMP%\dotnet-install.ps1'}"
    
    if exist "%TEMP%\dotnet-install.ps1" (
        powershell -ExecutionPolicy Bypass -File "%TEMP%\dotnet-install.ps1" -Channel 6.0 -Runtime dotnet -InstallDir "%ProgramFiles%\dotnet"
        
        REM Add to PATH
        setx PATH "%PATH%;%ProgramFiles%\dotnet" /M >nul 2>&1
        set PATH=%PATH%;%ProgramFiles%\dotnet
        
        echo [OK] .NET 6.0 Runtime installed successfully!
    ) else (
        echo [ERROR] Failed to download .NET installer.
        echo Please install .NET 6.0 manually from: https://dotnet.microsoft.com/download/dotnet/6.0
    )
) else (
    echo [OK] .NET is already installed.
)
echo.

REM ============================================================
REM Step 2: Check DigitalPersona Runtime
REM ============================================================
echo [Step 2/5] Checking DigitalPersona Runtime...

if exist "C:\Program Files\DigitalPersona\U.are.U RTE" (
    echo [OK] DigitalPersona Runtime is installed.
) else (
    echo [WARNING] DigitalPersona Runtime not found!
    echo.
    echo Please install the DigitalPersona U.are.U Runtime Environment:
    echo.
    echo 1. If you have the SDK CD/USB:
    echo    - Navigate to RTE\x64 folder
    echo    - Run setup.exe as Administrator
    echo.
    echo 2. Or contact your IT administrator for the installer
    echo.
    echo After installing, run this script again.
    echo.
    pause
    exit /b 1
)
echo.

REM ============================================================
REM Step 3: Check Node.js
REM ============================================================
echo [Step 3/5] Checking Node.js...

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Node.js not found. Installing...
    echo.
    
    REM Download Node.js installer using winget if available
    where winget >nul 2>&1
    if %errorLevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        echo [OK] Node.js installed successfully!
    ) else (
        echo [ERROR] Please install Node.js manually from: https://nodejs.org/
        echo Download the LTS version ^(18.x or later^)
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js !NODE_VERSION! is installed.
)
echo.

REM ============================================================
REM Step 4: Setup Fingerprint Service
REM ============================================================
echo [Step 4/5] Setting up Fingerprint Service...

set SERVICE_DIR=%INSTALL_DIR%\fingerprint-service
if not exist "%SERVICE_DIR%" mkdir "%SERVICE_DIR%"

REM Download fingerprint service from GitHub releases
echo [INFO] Please download the fingerprint service package from:
echo https://github.com/astrobsm/ASTROATTENDANCE-LOG/releases
echo.
echo Extract it to: %SERVICE_DIR%
echo.

REM Create start script
echo @echo off > "%SERVICE_DIR%\start-service.bat"
echo cd /d "%SERVICE_DIR%" >> "%SERVICE_DIR%\start-service.bat"
echo npm install >> "%SERVICE_DIR%\start-service.bat"
echo npm run dev >> "%SERVICE_DIR%\start-service.bat"

echo [OK] Service directory created: %SERVICE_DIR%
echo.

REM ============================================================
REM Step 5: Create Desktop Shortcut
REM ============================================================
echo [Step 5/5] Creating shortcuts...

REM Create VBS script to make shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\AstroBSM Fingerprint Service.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%SERVICE_DIR%\start-service.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%SERVICE_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Start AstroBSM Fingerprint Service" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo [OK] Desktop shortcut created.
echo.

REM ============================================================
REM Complete
REM ============================================================
echo ============================================================
echo    Installation Complete!
echo ============================================================
echo.
echo Next Steps:
echo.
echo 1. Connect your DigitalPersona U.are.U 4500 device
echo    (The LED should light up when connected)
echo.
echo 2. Download the fingerprint service from:
echo    https://github.com/astrobsm/ASTROATTENDANCE-LOG/releases
echo.
echo 3. Extract to: %SERVICE_DIR%
echo.
echo 4. Double-click "AstroBSM Fingerprint Service" on your desktop
echo.
echo 5. Open the AstroBSM web application in your browser
echo.
echo ============================================================
echo.
pause
