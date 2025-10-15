# ChartedArt Mobile App - Deployment Guide

## EAS (Expo Application Services) Setup ✅

The app is now configured with EAS for building and deploying to app stores.

### Project Configuration
- **Project ID**: `e32d253a-2fb2-4330-a4a4-85a9cdf5e7e6`
- **Bundle ID (iOS)**: `com.chartedart.mobile`
- **Package Name (Android)**: `com.chartedart.mobile`
- **Owner**: `rulerev`

## Build Commands

### Development Build (Internal Testing)
```bash
# iOS development build
eas build --platform ios --profile development

# Android development build  
eas build --platform android --profile development

# Both platforms
eas build --profile development
```

### Preview Build (TestFlight/Internal Testing)
```bash
# iOS preview build
eas build --platform ios --profile preview

# Android preview build
eas build --platform android --profile preview

# Both platforms
eas build --profile preview
```

### Production Build (App Store Release)
```bash
# iOS production build
eas build --platform ios --profile production

# Android production build
eas build --platform android --profile production

# Both platforms
eas build --profile production
```

## Pre-Build Checklist

### 1. Environment Variables
Update `mobile/.env` with production values:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-production-supabase-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
EXPO_PUBLIC_API_URL=https://your-production-api-gateway-url.amazonaws.com/prod
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-production-stripe-key
```

### 2. App Assets
Create the following assets in `mobile/assets/`:
- `icon.png` (1024x1024) - App icon
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `splash.png` (1284x2778) - Splash screen
- `favicon.png` (48x48) - Web favicon

### 3. App Store Information
Update `mobile/app.json`:
- App name and description
- Version number
- Build numbers
- Bundle identifiers

### 4. Permissions
The app requests these permissions:
- **Camera**: For taking photos
- **Photo Library**: For selecting images
- **Notifications**: For order updates (optional)

## iOS Deployment

### Prerequisites
- Apple Developer Account ($99/year)
- Xcode installed (for local builds)
- iOS device for testing

### Steps
1. **Create App in App Store Connect**
   ```bash
   # This will be done automatically by EAS
   ```

2. **Build for TestFlight**
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Submit to TestFlight**
   ```bash
   eas submit --platform ios
   ```

4. **Submit to App Store**
   ```bash
   eas submit --platform ios --profile production
   ```

### iOS Configuration
- **Minimum iOS Version**: 13.0
- **Device Support**: iPhone and iPad
- **Orientation**: Portrait only
- **Background Modes**: None required

## Android Deployment

### Prerequisites
- Google Play Console Account ($25 one-time)
- Android device for testing

### Steps
1. **Build APK/AAB**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Google Play**
   ```bash
   eas submit --platform android
   ```

### Android Configuration
- **Minimum SDK Version**: 21 (Android 5.0)
- **Target SDK Version**: Latest
- **Architecture**: Universal (arm64-v8a, armeabi-v7a, x86_64)

## Environment-Specific Builds

### Development Environment
```bash
# Build with development API endpoints
EXPO_PUBLIC_API_URL=https://dev-api.chartedart.com eas build --profile development
```

### Staging Environment
```bash
# Build with staging API endpoints
EXPO_PUBLIC_API_URL=https://staging-api.chartedart.com eas build --profile preview
```

### Production Environment
```bash
# Build with production API endpoints
EXPO_PUBLIC_API_URL=https://api.chartedart.com eas build --profile production
```

## Testing Builds

### Internal Testing
1. **Development Build**: Install on device via Expo Go or development client
2. **Preview Build**: Distribute via TestFlight (iOS) or Internal Testing (Android)

### External Testing
1. **TestFlight** (iOS): Add external testers
2. **Google Play Internal Testing** (Android): Share testing link

## Monitoring and Analytics

### Crash Reporting
EAS includes built-in crash reporting. View crashes in:
- Expo Dashboard
- App Store Connect (iOS)
- Google Play Console (Android)

### Performance Monitoring
Consider adding:
- Sentry for error tracking
- Firebase Analytics
- Flipper for debugging

## Release Process

### Version Management
```bash
# Update version in app.json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

### Release Workflow
1. **Update version numbers**
2. **Test thoroughly on devices**
3. **Build production version**
4. **Submit to app stores**
5. **Monitor for issues**
6. **Release to users**

## Troubleshooting

### Common Build Issues
```bash
# Clear EAS cache
eas build --clear-cache

# Check build logs
eas build:list

# View specific build
eas build:view [build-id]
```

### Build Failures
- Check environment variables
- Verify app.json configuration
- Review build logs
- Check for dependency conflicts

### Submission Issues
- Verify app store credentials
- Check app metadata
- Review rejection reasons
- Update app information

## Security Considerations

### Production Checklist
- [ ] Use production API endpoints
- [ ] Use production Stripe keys
- [ ] Enable SSL pinning
- [ ] Obfuscate sensitive data
- [ ] Review app permissions
- [ ] Test payment flows
- [ ] Verify data encryption

### App Store Review
- [ ] Test all features work
- [ ] Provide test account credentials
- [ ] Include privacy policy
- [ ] Describe app functionality
- [ ] Follow platform guidelines

## Support and Maintenance

### Post-Launch
- Monitor crash reports
- Track user feedback
- Plan feature updates
- Maintain backend compatibility
- Update dependencies regularly

### Emergency Updates
```bash
# Quick production build and submit
eas build --profile production --auto-submit
```

---

## Quick Commands Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for testing
eas build --profile preview

# Build for production
eas build --profile production

# Submit to app stores
eas submit

# Check build status
eas build:list

# View project info
eas project:info
```

**Status**: ✅ Ready for building and deployment
**Next Step**: Create app assets and build first preview version