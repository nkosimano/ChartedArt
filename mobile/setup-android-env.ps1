# Android Environment Setup Script
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android SDK Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define SDK path
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "Checking Android SDK installation..." -ForegroundColor Yellow

# Check if SDK exists
if (Test-Path $androidSdkPath) {
    $itemCount = (Get-ChildItem $androidSdkPath -ErrorAction SilentlyContinue | Measure-Object).Count
    
    if ($itemCount -eq 0) {
        Write-Host "❌ Android SDK folder exists but is EMPTY!" -ForegroundColor Red
        Write-Host "   Location: $androidSdkPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️  You need to install Android Studio first!" -ForegroundColor Yellow
        Write-Host "   1. Download from: https://developer.android.com/studio" -ForegroundColor White
        Write-Host "   2. Run the installer" -ForegroundColor White
        Write-Host "   3. Complete the setup wizard (downloads SDK components)" -ForegroundColor White
        Write-Host "   4. Then run this script again" -ForegroundColor White
        Write-Host ""
        exit 1
    } else {
        Write-Host "✅ Android SDK found at: $androidSdkPath" -ForegroundColor Green
        Write-Host "   Contains $itemCount items" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Android SDK not found at: $androidSdkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Please install Android Studio first!" -ForegroundColor Yellow
    Write-Host "   Download from: https://developer.android.com/studio" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow

# Set ANDROID_HOME
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkPath, [System.EnvironmentVariableTarget]::User)
Write-Host "✅ Set ANDROID_HOME = $androidSdkPath" -ForegroundColor Green

# Get current PATH
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)

# Add platform-tools if not already in PATH
$platformTools = "%ANDROID_HOME%\platform-tools"
if ($currentPath -notlike "*$platformTools*") {
    $newPath = $currentPath + ";" + $platformTools
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Host "✅ Added to PATH: $platformTools" -ForegroundColor Green
} else {
    Write-Host "✓ Already in PATH: $platformTools" -ForegroundColor Gray
}

# Add emulator if not already in PATH
$emulator = "%ANDROID_HOME%\emulator"
if ($currentPath -notlike "*$emulator*") {
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
    $newPath = $currentPath + ";" + $emulator
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Host "✅ Added to PATH: $emulator" -ForegroundColor Green
} else {
    Write-Host "✓ Already in PATH: $emulator" -ForegroundColor Gray
}

# Add tools if not already in PATH
$tools = "%ANDROID_HOME%\tools"
if ($currentPath -notlike "*$tools*") {
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
    $newPath = $currentPath + ";" + $tools
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Host "✅ Added to PATH: $tools" -ForegroundColor Green
} else {
    Write-Host "✓ Already in PATH: $tools" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Environment variables configured!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: You must restart your terminal/IDE for changes to take effect!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify the setup:" -ForegroundColor White
Write-Host "  1. Close this terminal completely" -ForegroundColor White
Write-Host "  2. Open a NEW terminal" -ForegroundColor White
Write-Host "  3. Run: adb version" -ForegroundColor White
Write-Host ""
