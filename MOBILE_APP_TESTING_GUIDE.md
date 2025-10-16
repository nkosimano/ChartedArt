# 📱 ChartedArt Mobile App - Complete Testing Guide

## 🎯 **QUICK ANSWER TO YOUR QUESTION**

### **"No usable data found" when scanning QR code?**

**❌ You're using the wrong app!**

You **CANNOT** use your phone's built-in camera app to scan the Expo QR code. You **MUST** use the **Expo Go app**.

---

## ✅ **CORRECT WAY TO TEST THE MOBILE APP**

### **Step 1: Download Expo Go App**

1. **iOS (iPhone/iPad):**
   - Open App Store
   - Search for "Expo Go"
   - Download and install
   - **Link:** https://apps.apple.com/app/expo-go/id982107779

2. **Android:**
   - Open Google Play Store
   - Search for "Expo Go"
   - Download and install
   - **Link:** https://play.google.com/store/apps/details?id=host.exp.exponent

---

### **Step 2: Start the Mobile App Server**

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies (first time only)
npm install

# Start the development server
npm start
```

**What you'll see:**
- A QR code in your terminal
- A URL like `exp://192.168.1.xxx:8081`
- Metro bundler running

---

### **Step 3: Connect Your Phone**

#### **Option A: Scan QR Code (Recommended)**

1. **Open Expo Go app** on your phone (NOT your camera app!)
2. **iOS:** Tap "Scan QR Code" on the home screen
3. **Android:** Tap "Scan QR Code" on the Projects tab
4. **Scan the QR code** from your terminal
5. Wait for the app to load

#### **Option B: Manual URL Entry**

1. Open Expo Go app
2. Tap "Enter URL manually"
3. Copy the URL from your terminal (looks like `exp://192.168.1.xxx:8081`)
4. Paste and press "Connect"

#### **Option C: Tunnel Mode (If network issues)**

```bash
# Stop the current server (Ctrl+C)
npx expo start --tunnel
```

This creates a public URL that works from anywhere. Scan the new QR code with Expo Go.

---

## 🚀 **FULL SETUP CHECKLIST**

### **Prerequisites**

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Expo Go app installed on your phone
- [ ] Phone and computer on **same WiFi network**

### **Environment Setup**

- [x] ✅ `.env` file created in `mobile/` directory (DONE!)
- [ ] Update `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` with your Stripe test key
- [ ] Update `EXPO_PUBLIC_API_URL` with your API Gateway URL (optional for now)

### **Installation**

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Verify installation
npm start
```

---

## 🧪 **TESTING OPTIONS**

### **Option 1: Expo Go (Quick Testing)**

**Best for:** Quick testing, UI development, basic features

**Limitations:**
- Some native modules may not work fully
- AR features limited
- Biometric auth may not work

**How to use:**
```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

---

### **Option 2: Development Build (Full Features)**

**Best for:** Testing all features including AR, biometrics, push notifications

**Advantages:**
- ✅ All native features work
- ✅ AR works perfectly
- ✅ Biometric auth works
- ✅ Push notifications work
- ✅ No QR code issues

**How to build:**

```bash
# Install EAS CLI globally (first time only)
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS (requires Apple Developer account)
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

**After build completes:**
- **iOS:** Download from TestFlight or direct link
- **Android:** Download `.apk` file directly to your phone

**Build time:** ~15-20 minutes

---

### **Option 3: iOS Simulator (Mac Only)**

**Best for:** Quick testing without a physical device

```bash
cd mobile
npm start
# Press 'i' to open iOS Simulator
```

---

### **Option 4: Android Emulator**

**Best for:** Quick testing without a physical device

```bash
cd mobile
npm start
# Press 'a' to open Android Emulator
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: "No usable data found"**

**Solution:** You're using your phone's camera app instead of Expo Go. Download and use Expo Go app.

---

### **Problem: "Unable to connect to Metro"**

**Solutions:**
1. Make sure phone and computer are on the **same WiFi network**
2. Try tunnel mode: `npx expo start --tunnel`
3. Check firewall isn't blocking port 8081
4. Disable VPN if active

---

### **Problem: "Network request failed"**

**Solutions:**
1. Check `.env` file exists in `mobile/` directory
2. Verify `EXPO_PUBLIC_SUPABASE_URL` is correct
3. Enable mock data: Set `EXPO_PUBLIC_USE_MOCK_DATA=true` in `.env`
4. Restart the server: `npm start --clear`

---

### **Problem: App crashes on startup**

**Solutions:**
1. Clear cache: `npm start --clear`
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Check for errors in terminal
4. Try development build instead of Expo Go

---

### **Problem: "Unable to resolve [package-name]"**

**Example:** `Unable to resolve "expo-linear-gradient"`

**Solution:**
```bash
cd mobile
npm install
```

This installs all missing dependencies. The app should restart automatically.

---

## 📋 **FEATURE TESTING CHECKLIST**

### **Basic Features (Work in Expo Go)**

- [ ] App launches successfully
- [ ] Can navigate between screens
- [ ] Can browse artworks
- [ ] Can view artwork details
- [ ] Can add items to cart
- [ ] Can view cart
- [ ] Can sign up / log in
- [ ] Can view profile

### **Advanced Features (Require Development Build)**

- [ ] Haptic feedback on button press
- [ ] AR view opens and detects walls
- [ ] Visual search with camera
- [ ] Room advisor analyzes room
- [ ] Biometric checkout (Face ID/Touch ID)
- [ ] Push notifications received
- [ ] Offline mode works
- [ ] Smooth gestures and animations

---

## 🎯 **RECOMMENDED TESTING WORKFLOW**

### **For Quick UI Testing:**
1. Use Expo Go app
2. Enable mock data (`EXPO_PUBLIC_USE_MOCK_DATA=true`)
3. Test navigation and UI
4. Iterate quickly

### **For Full Feature Testing:**
1. Build development client with EAS
2. Install on physical device
3. Connect to real backend
4. Test all native features

### **For Production Testing:**
1. Build preview/production build
2. Test on TestFlight (iOS) or internal testing (Android)
3. Verify all features work
4. Get feedback from beta testers

---

## 📱 **CURRENT APP STATUS**

### **✅ What's Ready to Test**

1. **Core Features:**
   - Authentication (sign up, login, logout)
   - Product browsing and search
   - Cart management
   - Checkout flow (with Stripe)
   - Order history
   - Profile management

2. **Social Features:**
   - Events and competitions
   - Movements (social causes)
   - Puzzle pieces (collectibles)
   - Gallery submissions

3. **Advanced Features (Development Build Only):**
   - AR artwork visualization
   - AI visual search
   - AI room advisor
   - Biometric authentication
   - Haptic feedback
   - Push notifications
   - Offline mode
   - iOS widgets

### **⚠️ What Needs Backend Setup**

1. **API Gateway:** Update `EXPO_PUBLIC_API_URL` in `.env`
2. **Stripe:** Update `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`
3. **AI Services:** Update `EXPO_PUBLIC_AI_API_URL` in `.env` (optional)

### **🔄 What's Using Mock Data**

Currently, the app uses mock data for:
- Product listings
- User profiles
- Orders
- Events
- Movements

**To connect to real backend:**
1. Deploy backend to AWS
2. Update `.env` with API Gateway URL
3. Set `EXPO_PUBLIC_USE_MOCK_DATA=false`
4. Restart app

---

## 🚀 **NEXT STEPS**

### **Immediate (5 minutes):**
1. ✅ Download Expo Go app on your phone
2. ✅ Run `cd mobile && npm start`
3. ✅ Scan QR code with Expo Go app
4. ✅ Test basic navigation and UI

### **Short-term (1 hour):**
1. Update Stripe key in `.env`
2. Test checkout flow with test card
3. Test all screens and navigation
4. Report any bugs or issues

### **Long-term (1 day):**
1. Build development client with EAS
2. Install on physical device
3. Test all advanced features (AR, biometrics, etc.)
4. Connect to real backend when ready

---

## 📞 **NEED HELP?**

### **Common Resources:**
- Expo Documentation: https://docs.expo.dev/
- Expo Discord: https://chat.expo.dev/
- Expo Status: https://status.expo.dev/

### **Project-Specific:**
- Check `mobile/TROUBLESHOOTING.md` for more solutions
- Check `mobile/QR_CODE_TROUBLESHOOTING.md` for QR code issues
- Check `mobile/TESTING_GUIDE.md` for detailed testing instructions

---

## ✅ **SUMMARY**

**To test your mobile app RIGHT NOW:**

1. Download **Expo Go** app on your phone
2. Run `cd mobile && npm start` in terminal
3. Open **Expo Go** app (NOT camera app)
4. Scan the QR code
5. Start testing!

**The "no usable data found" error happens because you're using your phone's camera app instead of Expo Go.**

---

**Your mobile app is fully equipped and ready to test! Just use the right app (Expo Go) to scan the QR code.** 🚀

