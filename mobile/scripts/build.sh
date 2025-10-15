#!/bin/bash

# ChartedArt Mobile App Build Script

echo "🚀 ChartedArt Mobile App Build Script"
echo "======================================"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Show menu
echo ""
echo "Select build type:"
echo "1) Development build (internal testing)"
echo "2) Preview build (TestFlight/Internal testing)"
echo "3) Production build (App Store release)"
echo "4) Check build status"
echo "5) Submit to app stores"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🔨 Building development version..."
        eas build --profile development
        ;;
    2)
        echo "🔨 Building preview version..."
        eas build --profile preview
        ;;
    3)
        echo "🔨 Building production version..."
        echo "⚠️  Make sure you've updated environment variables for production!"
        read -p "Continue? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            eas build --profile production
        else
            echo "Build cancelled."
        fi
        ;;
    4)
        echo "📊 Checking build status..."
        eas build:list
        ;;
    5)
        echo "📤 Submitting to app stores..."
        eas submit
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "✅ Script completed!"