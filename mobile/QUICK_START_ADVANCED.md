# Quick Start Guide - Advanced Features

## 🚀 Get Started in 5 Minutes

This guide will help you quickly set up and test the advanced features of the ChartedArt mobile app.

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Expo CLI installed (`npm install -g expo-cli`)
- ✅ iOS device (for AR and biometric features)
- ✅ Xcode installed (macOS only, for iOS development)

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd mobile
npm install
```

This will install all required packages including:
- expo-haptics (haptic feedback)
- expo-local-authentication (Face ID/Touch ID)
- expo-gl (AR rendering)
- react-native-gesture-handler (gestures)
- react-native-reanimated (animations)

---

## Step 2: Configure Environment (1 minute)

Create or update `.env` file:

```env
# Existing variables
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=your-api-gateway-url
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# New for advanced features
EXPO_PUBLIC_AI_API_URL=your-ai-service-url
EXPO_PUBLIC_AR_MODELS_CDN=your-cdn-url
```

---

## Step 3: Start Development Server (30 seconds)

```bash
npm start
```

Scan the QR code with your iPhone camera to open in Expo Go.

---

## Step 4: Test Features (1 minute)

### Test Haptic Feedback
1. Tap any button in the app
2. Feel the subtle haptic feedback
3. Add item to cart - feel medium haptic
4. Complete action - feel success haptic

### Test Biometric Auth
1. Navigate to checkout
2. Select "Pay with Face ID"
3. Authenticate with Face ID
4. Experience instant payment

### Test Offline Mode
1. Browse some artworks
2. Enable airplane mode
3. Browse previously viewed items
4. Add to wishlist offline
5. Disable airplane mode
6. Watch automatic sync

---

## 🎨 Feature Demos

### AR View in Room
```
Location: Any artwork detail page
Button: "View in Room"
Requirements: Physical iOS device
Steps:
1. Tap "View in Room"
2. Point camera at wall
3. Wait for wall detection
4. Tap to place artwork
5. Adjust size/position
6. Capture screenshot
```

### AI Visual Search
```
Location: Search tab
Button: Camera icon
Steps:
1. Tap camera icon
2. Take photo or select from gallery
3. Wait 2-3 seconds for analysis
4. Browse similar artworks
5. Apply filters if needed
```

### AI Room Advisor
```
Location: Discover tab
Button: "Get Recommendations"
Steps:
1. Tap "Get Recommendations"
2. Take photo of your room
3. Wait for AI analysis
4. View room insights
5. Browse recommended artworks
```

---

## 🔧 Troubleshooting

### AR Not Working
**Issue**: AR screen crashes or shows error

**Solution**:
```bash
# Must use physical iOS device (iOS 11+)
# Simulator does not support ARKit
# Ensure camera permissions granted
```

### Haptics Not Working
**Issue**: No haptic feedback

**Solution**:
```bash
# Only works on physical devices
# Check device supports Taptic Engine (iPhone 6s+)
# Verify haptic settings enabled in iOS Settings
```

### Biometric Auth Fails
**Issue**: Face ID/Touch ID not working

**Solution**:
```bash
# Ensure biometric enrolled in device settings
# Check app permissions for Face ID
# Verify NSFaceIDUsageDescription in Info.plist
```

### Dependencies Not Installing
**Issue**: npm install fails

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm cache clean --force
npm install
```

---

## 📱 Testing on Physical Device

### Option 1: Expo Go (Fastest)
```bash
npm start
# Scan QR code with iPhone camera
```

**Limitations**:
- AR features may be limited
- Some native modules may not work fully

### Option 2: Development Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create development build
eas build --profile development --platform ios

# Install on device
# Scan QR code or download from Expo dashboard
```

**Advantages**:
- Full native module support
- AR works perfectly
- Biometric auth works
- All features available

---

## 🎯 Feature Testing Checklist

### Basic Features
- [ ] App launches successfully
- [ ] Navigation works
- [ ] Can browse artworks
- [ ] Can add to cart
- [ ] Can view cart

### Advanced Features
- [ ] Haptic feedback on button press
- [ ] AR view opens and detects walls
- [ ] Visual search returns results
- [ ] Room advisor analyzes room
- [ ] Biometric checkout works
- [ ] Offline mode works
- [ ] Push notifications received
- [ ] Gestures are smooth

---

## 🚀 Quick Feature Access

### Haptic Feedback
```typescript
import HapticFeedback from '@/lib/haptics';

// In any component
await HapticFeedback.buttonPress();
await HapticFeedback.addToCart();
await HapticFeedback.success();
```

### Biometric Auth
```typescript
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

const { authenticateForPayment } = useBiometricAuth();
const result = await authenticateForPayment(totalAmount);
```

### Offline Mode
```typescript
import { useOffline } from '@/hooks/useOffline';

const { isOnline, cacheData, getCachedData } = useOffline();
```

---

## 📊 Performance Monitoring

### Check App Performance
```bash
# Monitor FPS
# Open React Native Debugger
# Enable "Show Perf Monitor"

# Expected metrics:
# - UI: 60 FPS
# - JS: 60 FPS
# - RAM: < 150 MB
```

### Check AR Performance
```bash
# AR should run at 60 FPS
# Wall detection: < 2 seconds
# Placement: Instant
# No lag or jitter
```

---

## 🎨 UI/UX Testing

### Haptic Feedback Points
- ✅ All button presses
- ✅ Add to cart
- ✅ Remove from cart
- ✅ AR placement
- ✅ Biometric auth
- ✅ Purchase complete
- ✅ Navigation changes
- ✅ Toggle switches
- ✅ Pull to refresh

### Smooth Animations
- ✅ Screen transitions (60fps)
- ✅ List scrolling (smooth)
- ✅ Image loading (fade in)
- ✅ Modal animations (spring)
- ✅ Gesture responses (instant)

---

## 🔔 Push Notifications Testing

### Setup Test Notifications
```bash
# Use Expo Push Notification Tool
# https://expo.dev/notifications

# Get push token from app
# Send test notification
# Verify delivery
```

### Test Notification Types
- [ ] Order confirmation
- [ ] Shipping update
- [ ] Delivery notification
- [ ] Community interaction
- [ ] Promotional message

---

## 📱 Widget Testing (iOS Only)

### Setup Widget
1. Long press home screen
2. Tap "+" to add widget
3. Search "ChartedArt"
4. Select widget size
5. Add to home screen

### Test Widget Features
- [ ] Small widget displays artwork
- [ ] Medium widget shows details
- [ ] Large widget shows order status
- [ ] Tap opens app to correct screen
- [ ] Auto-refreshes hourly

---

## 🎯 Common Use Cases

### Use Case 1: Quick Purchase
```
Time: ~5 seconds
Steps:
1. Open app (1s)
2. Tap recent artwork (1s)
3. Biometric checkout (3s)
Result: Purchase complete!
```

### Use Case 2: AR Visualization
```
Time: ~10 seconds
Steps:
1. Browse artwork (2s)
2. Tap "View in Room" (1s)
3. Point at wall (2s)
4. Place artwork (1s)
5. Adjust and capture (4s)
Result: Perfect visualization!
```

### Use Case 3: Discover with AI
```
Time: ~15 seconds
Steps:
1. Open Visual Search (1s)
2. Take photo (2s)
3. AI analysis (3s)
4. Browse results (9s)
Result: Found similar art!
```

---

## 🐛 Debug Mode

### Enable Debug Features
```typescript
// In App.js or main entry
if (__DEV__) {
  // Enable performance monitor
  // Enable network inspector
  // Enable haptic debug logs
}
```

### View Logs
```bash
# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android

# Expo logs
npx expo start --dev-client
```

---

## 📚 Next Steps

### After Testing
1. ✅ Verify all features work
2. ✅ Check performance metrics
3. ✅ Test on multiple devices
4. ✅ Review user experience
5. ✅ Prepare for production

### Production Deployment
1. Update version in app.json
2. Create production build
3. Submit to App Store
4. Monitor analytics
5. Gather user feedback

---

## 🆘 Need Help?

### Resources
- **Documentation**: See ADVANCED_FEATURES.md
- **Installation**: See INSTALLATION_GUIDE.md
- **Comparison**: See FEATURE_COMPARISON.md
- **Status**: See IMPLEMENTATION_COMPLETE.md

### Support Channels
- GitHub Issues
- Development Team
- Expo Discord
- React Native Community

---

## ✅ Success Criteria

You're ready to proceed when:
- ✅ App launches in < 2 seconds
- ✅ All buttons have haptic feedback
- ✅ AR runs smoothly at 60fps
- ✅ Biometric auth works in < 1 second
- ✅ Visual search returns results in < 3 seconds
- ✅ Offline mode syncs automatically
- ✅ No crashes or errors
- ✅ UI is smooth and responsive

---

**Estimated Setup Time**: 5 minutes  
**Estimated Testing Time**: 15 minutes  
**Total Time to Get Started**: 20 minutes

🎉 **You're ready to experience the premium ChartedArt mobile app!**
