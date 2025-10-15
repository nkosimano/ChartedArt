# ChartedArt Mobile App - Setup & Deployment Guide

## ✅ Completed Setup Steps

### 1. Dependencies Installed ✅
```bash
✅ expo-notifications
✅ @react-native-async-storage/async-storage
✅ node-fetch (backend)
```

### 2. Configuration Updated ✅
- ✅ `app.json` - Added notification permissions and background modes
- ✅ `useNotifications.ts` - Project ID set to 'chartedart-mobile'
- ✅ iOS: UIBackgroundModes for remote notifications
- ✅ Android: NOTIFICATIONS permission added

### 3. Database Migration Created ✅
- ✅ SQL script: `database/migrations/add_push_token_to_profiles.sql`
- Ready to run on Supabase

---

## 🔄 Next Steps to Complete

### Step 1: Run Database Migration

**Option A: Supabase Dashboard (Recommended)**
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/migrations/add_push_token_to_profiles.sql`
4. Click "Run" to execute the migration
5. Verify success messages appear

**Option B: Supabase CLI**
```bash
supabase db push
```

**Verify Migration:**
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('push_token', 'push_token_updated_at');
```

---

### Step 2: Deploy Backend Changes

```bash
cd backend

# Build the SAM application
sam build

# Deploy (follow prompts for stack name, region, etc.)
sam deploy --guided

# Or if already configured:
sam deploy
```

**What gets deployed:**
- ✅ New Lambda: `RegisterPushTokenFunction`
- ✅ Updated Lambda: `UpdateOrderStatusFunction` (with push notifications)
- ✅ New API endpoint: `POST /push-token`
- ✅ CloudWatch log groups

**After deployment:**
- Note the API Gateway URL from outputs
- Update mobile app's `API_BASE_URL` in `constants/config.ts` if needed

---

### Step 3: Configure Expo for Push Notifications

**A. Create Expo Account (if not already done)**
```bash
npx expo login
```

**B. Initialize EAS (Expo Application Services)**
```bash
cd mobile
npx eas init
```

This will:
- Create `eas.json` configuration
- Link project to your Expo account
- Generate a project ID

**C. Update Push Notification Credentials**

For iOS:
```bash
npx eas credentials
# Select iOS
# Select Push Notifications
# Follow prompts to upload APNs certificates
```

For Android:
```bash
# Android uses FCM - configuration done through app.json
# No additional setup needed for basic notifications
```

---

### Step 4: Test Push Notifications

**A. Run on Physical Device (Required)**
```bash
cd mobile

# For iOS
npx expo run:ios --device

# For Android
npx expo run:android --device
```

**B. Test Flow:**
1. Launch app on physical device
2. App should request notification permission
3. Accept permission
4. Check logs for "Push token registered with backend"
5. Go to Supabase and verify `push_token` is stored in profiles table

**C. Test Notification Sending:**
1. Go to Supabase dashboard
2. Manually update an order status in the `orders` table
3. Check if notification appears on device

**D. Use Expo Push Notification Tool:**
Visit: https://expo.dev/notifications

Enter your push token and send a test notification.

---

## 📱 Building Production App (Tasks 30-35)

### Task 30: Configure app.json for iOS Deployment

**Already configured! ✅**
```json
{
  "ios": {
    "bundleIdentifier": "com.chartedart.mobile",
    "supportsTablet": true,
    "infoPlist": { ... }
  }
}
```

**Additional Configuration Needed:**
```bash
# Update app.json with production values
```

Add to `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

---

### Task 31: Create App Assets

**Required Assets:**
1. **App Icon** - 1024x1024px
   - Location: `assets/icon.png`
   - Format: PNG with transparency
   
2. **Adaptive Icon** - 1024x1024px
   - Location: `assets/adaptive-icon.png`
   
3. **Splash Screen** - 1284x2778px
   - Location: `assets/splash.png`
   
4. **Notification Icon** - 96x96px
   - Location: `assets/notification-icon.png`

**Generate Icons:**
```bash
# Use a tool like https://www.appicon.co/
# Or design in Figma/Sketch with your branding
```

---

### Task 32: Set up EAS Build Configuration

**Create `eas.json`:**
```bash
cd mobile
npx eas build:configure
```

This creates:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.chartedart.mobile"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### Task 33: Create Production Build with EAS

```bash
cd mobile

# Build for iOS (production)
npx eas build --platform ios --profile production

# Build process:
# 1. Code is uploaded to EAS servers
# 2. Dependencies are installed
# 3. Native code is compiled
# 4. IPA file is created
# 5. Download link is provided
```

**Monitor build:**
- Check build status: https://expo.dev/accounts/[your-account]/projects/chartedart-mobile/builds
- Estimated time: 10-30 minutes

**Download IPA:**
```bash
# After build completes, download from Expo dashboard
# Or use CLI:
npx eas build:download --platform ios --profile production
```

**Test on Device:**
```bash
# Install via TestFlight or direct install
# Verify all features work in production build
```

---

### Task 34: Set up App Store Connect

**Prerequisites:**
- Apple Developer Account ($99/year)
- Enrolled in Apple Developer Program

**Steps:**
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Platform:** iOS
   - **Name:** ChartedArt
   - **Primary Language:** English
   - **Bundle ID:** com.chartedart.mobile
   - **SKU:** chartedart-mobile-001

4. **App Information:**
   - Category: Shopping or Lifestyle
   - Content Rights: Check if you own rights
   - Age Rating: Complete questionnaire

5. **Pricing and Availability:**
   - Price: Free (with in-app purchases if applicable)
   - Availability: All countries or select specific

6. **Prepare for Submission:**
   - Upload screenshots (required sizes)
   - Write app description
   - Add keywords
   - Privacy policy URL
   - Support URL

**Required Screenshots:**
- 6.5" Display (iPhone 14 Pro Max): 1284 x 2778
- 5.5" Display (iPhone 8 Plus): 1242 x 2208

---

### Task 35: Submit App to App Store

```bash
cd mobile

# Submit build to App Store
npx eas submit --platform ios --profile production

# Alternative: Manual upload via Transporter app
# or App Store Connect website
```

**Submission Checklist:**
- [ ] App tested on physical device
- [ ] All features working
- [ ] Screenshots uploaded
- [ ] App description written
- [ ] Privacy policy added
- [ ] Keywords set
- [ ] Age rating completed
- [ ] Build uploaded
- [ ] App information complete

**Review Process:**
- Typical review time: 24-48 hours
- Monitor status in App Store Connect
- Respond to any rejection feedback promptly

---

## 🧪 Optional: Testing Infrastructure (Tasks 36-40)

### Task 36: Set up Testing Infrastructure

```bash
cd mobile

# Install testing dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native

# Configure Jest in package.json
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

---

### Task 37: Write Unit Tests

**Example Test Files:**
```
mobile/
  __tests__/
    lib/
      api/
        client.test.ts
      storage/
        cache.test.ts
    contexts/
      AuthContext.test.tsx
      CartContext.test.tsx
    utils/
      validation.test.ts
      errorHandler.test.ts
```

---

### Task 38: Write Integration Tests

```bash
# Install Detox for E2E testing
npm install --save-dev detox detox-cli

# Initialize Detox
npx detox init
```

---

### Task 39: Set up Performance Monitoring

```bash
# Install Sentry for crash reporting and performance
npm install @sentry/react-native

# Initialize Sentry
npx @sentry/wizard -i reactNative -p ios android
```

---

### Task 40: Implement Crash Reporting

**Already prepared!** ✅
- ErrorBoundary component exists
- Error handler utilities ready
- Just need to integrate Sentry DSN

---

## 📋 Quick Reference Commands

### Mobile Development
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Clear cache
npx expo start -c
```

### Backend Deployment
```bash
cd backend
sam build
sam deploy
```

### EAS Build & Submit
```bash
cd mobile
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

---

## 🎯 Success Criteria

### Ready for Production When:
- ✅ All dependencies installed
- ✅ Database migration applied
- ✅ Backend deployed successfully
- ✅ Push notifications working on physical device
- ✅ App icon and splash screen created
- ✅ Production build created with EAS
- ✅ App submitted to App Store
- ✅ All core features tested and working

---

## 🆘 Troubleshooting

### Push Notifications Not Working
1. Check device has internet connection
2. Verify push token registered in Supabase
3. Check CloudWatch logs for Lambda errors
4. Ensure app has notification permission
5. Test with Expo push notification tool

### Build Fails
1. Check eas.json configuration
2. Verify bundle identifier matches
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Clear cache: `npx expo start -c`

### Backend Deployment Issues
1. Verify AWS credentials configured
2. Check SAM CLI version: `sam --version`
3. Review CloudFormation events in AWS Console
4. Check Lambda execution roles

---

## 📞 Support

- **Expo Documentation:** https://docs.expo.dev
- **AWS SAM Documentation:** https://docs.aws.amazon.com/serverless-application-model
- **App Store Connect Help:** https://developer.apple.com/support/app-store-connect

---

**Last Updated:** October 14, 2025  
**Status:** Ready for deployment! 🚀
