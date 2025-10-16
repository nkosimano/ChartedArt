#!/bin/bash

# ChartedArt Frontend Dependencies Installer
# This script installs all required dependencies for the Movement and Puzzle Piece systems

echo "🎨 ChartedArt Frontend Dependencies Installer"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing Web Dependencies..."
echo ""

# Web dependencies (most should already be in package.json)
npm install --save \
    @stripe/react-stripe-js \
    @stripe/stripe-js \
    sonner \
    framer-motion

echo ""
echo "✅ Web dependencies installed!"
echo ""

# Check if mobile directory exists
if [ -d "mobile" ]; then
    echo "📱 Installing Mobile Dependencies..."
    echo ""
    
    cd mobile
    
    npm install --save \
        @gorhom/bottom-sheet \
        expo-linear-gradient \
        react-native-reanimated \
        react-native-gesture-handler
    
    echo ""
    echo "✅ Mobile dependencies installed!"
    echo ""
    
    # iOS pods (if on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ -d "ios" ]; then
            echo "🍎 Installing iOS Pods..."
            cd ios
            pod install
            cd ..
            echo "✅ iOS pods installed!"
        fi
    fi
    
    cd ..
else
    echo "⚠️  Mobile directory not found. Skipping mobile dependencies."
fi

echo ""
echo "=============================================="
echo "✨ Installation Complete!"
echo ""
echo "Next steps:"
echo "1. Set up your .env files (see .env.example)"
echo "2. Configure Stripe keys"
echo "3. Set up Supabase connection"
echo "4. Run 'npm run dev' for web or 'npm start' in mobile/"
echo ""
echo "📚 See FRONTEND_QUICKSTART.md for detailed setup instructions"
echo "=============================================="
