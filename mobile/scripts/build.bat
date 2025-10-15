@echo off
echo 🚀 ChartedArt Mobile App Build Script
echo ======================================

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ EAS CLI not found. Installing...
    npm install -g eas-cli
)

echo.
echo Select build type:
echo 1) Development build (internal testing)
echo 2) Preview build (TestFlight/Internal testing)
echo 3) Production build (App Store release)
echo 4) Check build status
echo 5) Submit to app stores
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo 🔨 Building development version...
    eas build --profile development
) else if "%choice%"=="2" (
    echo 🔨 Building preview version...
    eas build --profile preview
) else if "%choice%"=="3" (
    echo 🔨 Building production version...
    echo ⚠️  Make sure you've updated environment variables for production!
    set /p confirm="Continue? (y/N): "
    if /i "%confirm%"=="y" (
        eas build --profile production
    ) else (
        echo Build cancelled.
    )
) else if "%choice%"=="4" (
    echo 📊 Checking build status...
    eas build:list
) else if "%choice%"=="5" (
    echo 📤 Submitting to app stores...
    eas submit
) else (
    echo ❌ Invalid choice. Please run the script again.
)

echo.
echo ✅ Script completed!
pause