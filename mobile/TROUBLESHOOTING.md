# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Cannot read property 'base' of undefined"

**Issue**: Runtime error when accessing typography or color constants.

**Solution**: 
- Constants have been updated with backward compatibility
- Make sure you're using the correct import format
- Both old (`typography.fontSize.base`) and new (`TYPOGRAPHY.sizes.md`) formats are supported

### 2. "Value being stored in SecureStore is larger than 2048 bytes"

**Issue**: Supabase session tokens are large and trigger SecureStore warning.

**Status**: ⚠️ Warning only - app continues to work
**Impact**: None - this is just a warning from Expo SecureStore
**Solution**: Already handled with error catching in Supabase client

### 3. "Got an invalid value for 'component' prop for screen"

**Issue**: Navigation screen component is not properly exported.

**Solution**: 
- Check that screen components have `export default`
- Verify imports in App.js are correct
- No duplicate imports or exports

### 4. Metro Bundler Issues

**Issue**: "Cannot connect to Metro bundler" or bundling errors.

**Solutions**:
```bash
# Clear cache and restart
npm start -- --clear

# Reset Metro cache
npx react-native start --reset-cache

# Clear node modules and reinstall
rm -rf node_modules
npm install
```

### 5. iOS Simulator Not Opening

**Issue**: Simulator doesn't launch when pressing 'i'.

**Solutions**:
```bash
# Try direct command
expo start --ios

# Check if Xcode is installed
xcode-select --install

# Open simulator manually
open -a Simulator
```

### 6. Android Emulator Issues

**Issue**: Android emulator doesn't start or connect.

**Solutions**:
```bash
# Try direct command
expo start --android

# Check Android Studio setup
# Make sure AVD is created and running

# Check ADB connection
adb devices
```

### 7. Network/API Errors

**Issue**: "Network request failed" or API connection issues.

**Solutions**:
- Check `.env` file has correct API_URL
- Verify backend is running
- Check network connectivity
- For iOS simulator, use computer's IP instead of localhost

### 8. Stripe Payment Issues

**Issue**: Payment sheet not showing or payment failing.

**Solutions**:
- Verify `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in .env
- Check Stripe key matches backend secret key
- Use test card numbers: 4242 4242 4242 4242
- Check backend payment intent creation

### 9. Image Upload Failures

**Issue**: Images not uploading or S3 errors.

**Solutions**:
- Check S3 bucket permissions
- Verify CORS configuration on S3
- Check backend `/generate-upload-url` endpoint
- Ensure proper image permissions on device

### 10. Authentication Issues

**Issue**: Login/signup not working or session not persisting.

**Solutions**:
- Check Supabase URL and anon key in .env
- Verify Supabase project settings
- Clear SecureStore: restart app completely
- Check network connectivity

## Debug Tools

### React Native Debugger
```bash
# Install
npm install -g react-native-debugger

# Open
react-native-debugger
```

### Flipper (Alternative)
- Download from Facebook
- Connect to running app
- View network requests, logs, etc.

### Console Logs
```bash
# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android
```

### Debug Menu
- **iOS Simulator**: Cmd+D
- **Android Emulator**: Cmd+M
- **Physical Device**: Shake device

## Environment Issues

### Node Version
```bash
# Check version (should be 16+)
node --version

# Use nvm to switch if needed
nvm use 16
```

### Expo CLI
```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Check version
expo --version
```

### Dependencies
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update
```

## Performance Issues

### Slow Bundling
- Clear Metro cache: `npm start -- --clear`
- Close other apps to free memory
- Use `--dev false` for production-like performance

### App Crashes
- Check console for error messages
- Use error boundaries in React components
- Test on physical device vs simulator

### Memory Issues
- Optimize images before upload
- Use FlatList for long lists
- Avoid memory leaks in useEffect

## Production Issues

### Build Failures
```bash
# iOS build
expo build:ios --clear-cache

# Android build
expo build:android --clear-cache
```

### App Store Submission
- Check app.json configuration
- Verify bundle identifier
- Test on physical device
- Follow Apple/Google guidelines

## Getting Help

### Check Logs First
1. Metro bundler console
2. Device console (Cmd+D debug menu)
3. Network tab in debugger
4. React Native logs

### Common Commands
```bash
# Start fresh
npm start -- --clear

# Restart with cache clear
rm -rf node_modules && npm install && npm start

# Check dependencies
npm ls

# Verify environment
env | grep EXPO
```

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe React Native Docs](https://stripe.com/docs/stripe-react-native)

---

**Remember**: Most issues are environment-related. Try clearing caches and restarting before diving deep into code changes.