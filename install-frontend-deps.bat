@echo off
REM ChartedArt Frontend Dependencies Installer (Windows)
REM This script installs all required dependencies for the Movement and Puzzle Piece systems

echo.
echo 🎨 ChartedArt Frontend Dependencies Installer
echo ==============================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

echo 📦 Installing Web Dependencies...
echo.

REM Web dependencies
call npm install --save @stripe/react-stripe-js @stripe/stripe-js sonner framer-motion

echo.
echo ✅ Web dependencies installed!
echo.

REM Check if mobile directory exists
if exist "mobile" (
    echo 📱 Installing Mobile Dependencies...
    echo.
    
    cd mobile
    
    call npm install --save @gorhom/bottom-sheet expo-linear-gradient react-native-reanimated react-native-gesture-handler
    
    echo.
    echo ✅ Mobile dependencies installed!
    echo.
    
    cd ..
) else (
    echo ⚠️  Mobile directory not found. Skipping mobile dependencies.
)

echo.
echo ==============================================
echo ✨ Installation Complete!
echo.
echo Next steps:
echo 1. Set up your .env files (see .env.example)
echo 2. Configure Stripe keys
echo 3. Set up Supabase connection
echo 4. Run 'npm run dev' for web or 'npm start' in mobile/
echo.
echo 📚 See FRONTEND_QUICKSTART.md for detailed setup instructions
echo ==============================================
echo.
pause
