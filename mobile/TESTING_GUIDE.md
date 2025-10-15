# Testing Guide - ChartedArt Mobile App

## Current Status: ✅ Ready for Full Testing

The app is now configured to work with both mock data and real backend.

## Testing Modes

### 1. 🧪 Mock Data Mode (Current)
**Perfect for UI/UX testing without backend**

**Configuration:**
```env
EXPO_PUBLIC_USE_MOCK_DATA=true
EXPO_PUBLIC_API_URL=https://api.chartedart.com/dev
```

**What Works:**
- ✅ Authentication (Supabase)
- ✅ All screen navigation
- ✅ Image picker (camera/gallery)
- ✅ Mock cart with sample items
- ✅ Mock order history
- ✅ Mock gallery items
- ✅ All UI interactions

**What's Simulated:**
- API calls return mock data
- Image uploads are simulated
- Payment processing is mocked

### 2. 🌐 Real Backend Mode
**For full end-to-end testing**

**Configuration:**
```env
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_API_URL=https://your-real-api-gateway-url.amazonaws.com/prod
```

**Requirements:**
- Deployed AWS backend
- API Gateway URL
- S3 bucket configured
- Stripe keys configured

## How to Switch Modes

### Switch to Real Backend:
1. **Deploy your backend:**
   ```bash
   cd backend
   sam deploy
   ```

2. **Get API Gateway URL** from AWS Console or deployment output

3. **Update mobile/.env:**
   ```env
   EXPO_PUBLIC_USE_MOCK_DATA=false
   EXPO_PUBLIC_API_URL=https://your-actual-api-gateway-url.amazonaws.com/prod
   ```

4. **Restart the app:**
   ```bash
   npm start -- --clear
   ```

### Switch to Mock Mode:
1. **Update mobile/.env:**
   ```env
   EXPO_PUBLIC_USE_MOCK_DATA=true
   ```

2. **Restart the app**

## Testing Checklist

### 🧪 Mock Mode Testing (Current)
- [ ] **Authentication**
  - [ ] Sign up with new account
  - [ ] Login with existing account
  - [ ] Logout and session clearing
  - [ ] Session persistence after app restart

- [ ] **Navigation**
  - [ ] All tab navigation works
  - [ ] Screen transitions are smooth
  - [ ] Back navigation works
  - [ ] Deep linking to screens

- [ ] **Image Picker**
  - [ ] Camera capture works
  - [ ] Gallery selection works
  - [ ] Image preview displays
  - [ ] Permissions are requested

- [ ] **Create Screen**
  - [ ] Image selection UI
  - [ ] Size selector works
  - [ ] Frame selector works
  - [ ] Price calculation updates
  - [ ] Add to cart button works

- [ ] **Cart Screen**
  - [ ] Mock items display
  - [ ] Quantity updates work
  - [ ] Remove items works
  - [ ] Pull-to-refresh works
  - [ ] Empty state displays

- [ ] **Order History**
  - [ ] Mock orders display
  - [ ] Order status badges
  - [ ] Order details navigation
  - [ ] Pull-to-refresh works

- [ ] **Gallery**
  - [ ] Mock gallery items display
  - [ ] Grid layout works
  - [ ] Item details show
  - [ ] Reorder functionality

- [ ] **Account**
  - [ ] Profile information displays
  - [ ] Edit profile works
  - [ ] Navigation to other screens
  - [ ] Logout works

### 🌐 Real Backend Testing (When Available)
- [ ] **API Integration**
  - [ ] Real cart operations
  - [ ] Real image uploads to S3
  - [ ] Real order creation
  - [ ] Real payment processing

- [ ] **Data Persistence**
  - [ ] Cart persists between sessions
  - [ ] Orders are saved
  - [ ] Gallery items are stored

- [ ] **Payment Flow**
  - [ ] Stripe payment sheet works
  - [ ] Test card processing
  - [ ] Order confirmation
  - [ ] Cart clearing after purchase

## Quick Test Commands

```bash
# Start app with clean cache
npm start -- --clear

# Check current configuration
node scripts/setup-backend.js

# Build for testing on device
npm run build:dev

# View logs
npx react-native log-ios
npx react-native log-android
```

## Test Data

### Mock User Account
- **Email**: Any email (mock mode)
- **Password**: Any password (mock mode)

### Test Credit Cards (Stripe)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Expiry**: Any future date
- **CVC**: Any 3 digits

### Sample Images
The app uses Picsum for sample images in mock mode:
- https://picsum.photos/400/300?random=1
- https://picsum.photos/400/300?random=2

## Debugging

### Enable Detailed Logging
```env
EXPO_PUBLIC_ENABLE_LOGGING=true
```

### Common Issues
1. **"Network request failed"**: Check if USE_MOCK_DATA is true
2. **"Component not found"**: Clear cache and restart
3. **Images not loading**: Check network connection
4. **Authentication issues**: Check Supabase configuration

### Debug Tools
- React Native Debugger
- Flipper
- Console logs in Metro bundler
- Device logs via `npx react-native log-ios/android`

## Performance Testing

### Test on Different Devices
- [ ] iPhone (various models)
- [ ] iPad
- [ ] Android phones (various sizes)
- [ ] Android tablets

### Test Different Scenarios
- [ ] Slow network connection
- [ ] No network connection
- [ ] Low memory conditions
- [ ] Background/foreground switching

## Ready for Production Testing

When your backend is deployed:

1. **Update API URL** in mobile/.env
2. **Set USE_MOCK_DATA=false**
3. **Test all features end-to-end**
4. **Verify payment processing**
5. **Test on physical devices**
6. **Build preview version** for TestFlight/Internal Testing

---

## Current Recommendation

**Start with Mock Mode Testing** to verify all UI/UX works perfectly, then switch to Real Backend Mode when your API is deployed.

**Status**: ✅ Ready for comprehensive testing
**Mode**: 🧪 Mock Data (perfect for UI testing)
**Next**: Test all screens and interactions, then deploy backend for full testing