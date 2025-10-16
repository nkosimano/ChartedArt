# Installation & Setup Guide - Advanced Features

## Prerequisites

### System Requirements
- **macOS**: Required for iOS development (Monterey or later)
- **Xcode**: 14.0 or later (for iOS builds)
- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Expo CLI**: Latest version
- **EAS CLI**: Latest version (for builds)

### Developer Accounts
- Apple Developer Account (for iOS deployment)
- Expo Account (for EAS builds)
- Stripe Account (for payments)

---

## Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### New Dependencies Installed
The following packages have been added for advanced features:

```json
{
  "expo-gl": "~16.0.4",                    // AR rendering
  "expo-haptics": "~14.0.3",               // Haptic feedback
  "expo-local-authentication": "~15.0.3",  // Face ID/Touch ID
  "expo-device": "~7.0.3",                 // Device info
  "expo-constants": "~18.0.3",             // App constants
  "react-native-gesture-handler": "~2.22.0", // Advanced gestures
  "react-native-reanimated": "~4.0.0"      // Smooth animations
}
```

---

## Step 2: Configure Environment Variables

Create or update `.env` file in the mobile directory:

```env
# Existing variables
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=your-api-gateway-url
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# New variables for advanced features
EXPO_PUBLIC_AI_API_URL=your-ai-service-url
EXPO_PUBLIC_AR_MODELS_CDN=your-cdn-url-for-3d-models
```

---

## Step 3: iOS Configuration

### Update app.json
The `app.json` has been updated with new permissions and plugins:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera for AR and visual search",
        "NSPhotoLibraryUsageDescription": "Access photos for visual search",
        "NSFaceIDUsageDescription": "Use Face ID for secure checkout",
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      "expo-local-authentication",
      "react-native-gesture-handler",
      "react-native-reanimated"
    ]
  }
}
```

### Configure Xcode Project (for native builds)

1. Open the iOS project in Xcode:
```bash
npx expo prebuild
cd ios
open ChartedArt.xcworkspace
```

2. Enable required capabilities:
   - Face ID
   - Push Notifications
   - Background Modes
   - Camera
   - Photo Library

3. Add ARKit framework:
   - Select project target
   - Go to "Frameworks, Libraries, and Embedded Content"
   - Add `ARKit.framework`

---

## Step 4: Android Configuration

### Update app.json for Android
```json
{
  "android": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT"
    ]
  }
}
```

---

## Step 5: Backend Setup

### Required API Endpoints

Create the following endpoints in your backend:

#### 1. AI Visual Search
```typescript
POST /ai/visual-search
Content-Type: multipart/form-data

Request:
{
  imageUri: string,
  filters: string[]
}

Response:
{
  results: Array<{
    id: string,
    title: string,
    artist: string,
    imageUrl: string,
    price: number,
    similarity: number,
    style: string,
    colors: string[]
  }>
}
```

#### 2. AI Room Advisor
```typescript
POST /ai/analyze-room
Content-Type: multipart/form-data

Request:
{
  imageUri: string
}

Response:
{
  roomType: string,
  style: string,
  dominantColors: string[],
  lightingCondition: string,
  wallSpace: { width: number, height: number },
  recommendations: {
    sizes: string[],
    styles: string[],
    colors: string[],
    placement: string
  },
  suggestedArtworks: Array<{...}>
}
```

#### 3. 3D Model Generation (for AR)
```typescript
POST /artwork/generate-3d-model
Request:
{
  artworkId: string,
  size: string,
  frame: string
}

Response:
{
  modelUrl: string,
  textureUrl: string,
  dimensions: { width: number, height: number, depth: number }
}
```

#### 4. Push Token Registration
```typescript
POST /push-token
Request:
{
  token: string,
  platform: 'ios' | 'android',
  userId: string
}

Response:
{
  success: boolean
}
```

#### 5. Widget Data Endpoints
```typescript
GET /api/widget/artwork-of-day
Response:
{
  id: string,
  title: string,
  artist: string,
  imageUrl: string,
  price: number
}

GET /api/widget/order-status?userId={userId}
Response:
{
  orderId: string,
  status: string,
  trackingNumber?: string,
  estimatedDelivery?: string
}
```

---

## Step 6: iOS Widget Setup

### Create Widget Extension

1. Open Xcode project
2. File → New → Target
3. Select "Widget Extension"
4. Name it "ChartedArtWidget"
5. Copy the widget code from `ios/ChartedArtWidget/ChartedArtWidget.swift`

### Configure Widget in Xcode

1. Set deployment target to iOS 14.0+
2. Add required capabilities
3. Configure App Groups for data sharing
4. Build and run

---

## Step 7: Testing Setup

### Install Development Build

```bash
# Create development build
eas build --profile development --platform ios

# Install on device
# Scan QR code or download from Expo dashboard
```

### Test Individual Features

#### Test AR
```bash
# Run on physical iOS device (AR doesn't work in simulator)
npm run ios
# Navigate to any artwork → Tap "View in Room"
```

#### Test Biometric Auth
```bash
# Simulator: Hardware → Face ID → Enrolled
# Physical device: Must have Face ID or Touch ID set up
```

#### Test Haptics
```bash
# Only works on physical devices
# Tap buttons, add to cart, etc. to feel haptic feedback
```

#### Test Offline Mode
```bash
# Enable airplane mode
# Browse previously viewed content
# Add items to wishlist
# Disable airplane mode to see sync
```

---

## Step 8: Production Build

### iOS Production Build

```bash
# Update version in app.json
# Build for App Store
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android Production Build

```bash
# Build for Google Play
eas build --profile production --platform android

# Submit to Google Play
eas submit --platform android
```

---

## Troubleshooting

### Common Issues

#### 1. AR Not Working
**Problem**: AR screen shows error or crashes
**Solution**: 
- Ensure running on physical iOS device (iOS 11+)
- Check camera permissions are granted
- Verify ARKit is available on device

#### 2. Biometric Auth Fails
**Problem**: Face ID/Touch ID not working
**Solution**:
- Check device has biometric hardware
- Verify biometric is enrolled in device settings
- Ensure `NSFaceIDUsageDescription` is in Info.plist

#### 3. Haptics Not Working
**Problem**: No haptic feedback
**Solution**:
- Only works on physical devices
- Check device supports Taptic Engine
- Verify haptic settings enabled in device settings

#### 4. Offline Mode Issues
**Problem**: Data not syncing
**Solution**:
- Check network connectivity
- Verify AsyncStorage permissions
- Clear app cache and retry

#### 5. Widget Not Updating
**Problem**: Widget shows old data
**Solution**:
- Check widget timeline configuration
- Verify API endpoints are accessible
- Force widget refresh in iOS settings

#### 6. Push Notifications Not Received
**Problem**: Notifications not showing
**Solution**:
- Verify push token is registered
- Check notification permissions
- Test with Expo push notification tool

---

## Performance Optimization

### Image Optimization
```typescript
// Use optimized image formats
<Image 
  source={{ uri: imageUrl }}
  resizeMode="cover"
  cachePolicy="memory-disk"
/>
```

### Memory Management
```typescript
// Clear image cache periodically
import { Image } from 'react-native';
Image.clearMemoryCache();
Image.clearDiskCache();
```

### AR Performance
```typescript
// Limit AR session duration
// Pause AR when app goes to background
// Release AR resources when not needed
```

---

## Monitoring & Analytics

### Setup Sentry (Optional)
```bash
npm install @sentry/react-native
```

### Track Feature Usage
```typescript
// Track AR usage
analytics.track('ar_view_opened', { artworkId });

// Track biometric usage
analytics.track('biometric_payment', { success: true });

// Track offline actions
analytics.track('offline_action', { action: 'add_to_wishlist' });
```

---

## Security Checklist

- [ ] All API endpoints use HTTPS
- [ ] Biometric data never leaves device
- [ ] Push tokens stored securely
- [ ] Sensitive data encrypted in AsyncStorage
- [ ] API keys not hardcoded
- [ ] Certificate pinning implemented (optional)
- [ ] Jailbreak detection enabled (optional)

---

## Deployment Checklist

### Pre-Launch
- [ ] All features tested on physical devices
- [ ] AR works on multiple device models
- [ ] Biometric auth tested on Face ID and Touch ID devices
- [ ] Offline mode thoroughly tested
- [ ] Push notifications working
- [ ] Widgets displaying correctly
- [ ] Performance benchmarks met
- [ ] Memory leaks checked
- [ ] Battery usage optimized

### App Store Requirements
- [ ] Privacy policy updated with new features
- [ ] App Store screenshots include AR and new features
- [ ] App description mentions advanced features
- [ ] Required permissions explained
- [ ] Test account provided for review
- [ ] Demo video prepared

---

## Support & Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Apple ARKit Guide](https://developer.apple.com/augmented-reality/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Community
- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)

### Contact
For technical support, contact the development team.

---

**Last Updated**: January 2025  
**Version**: 2.0.0
