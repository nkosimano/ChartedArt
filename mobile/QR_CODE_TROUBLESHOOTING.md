# QR Code Scanning Issues - Quick Fix

## Problem: "No usable data found" when scanning QR code

---

## Solution 1: Use Expo Go App (Recommended)

### ⚠️ Don't use your phone's built-in camera/QR scanner!

**You MUST use the Expo Go app to scan the QR code.**

### Steps:
1. **Download Expo Go:**
   - **iOS:** [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
   - **Android:** [Google Play - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Open Expo Go app** (not your camera)

3. **Scan the QR code** from within the Expo Go app:
   - iOS: Tap "Scan QR Code" on the home screen
   - Android: Tap "Scan QR Code" on the Projects tab

---

## Solution 2: Use Tunnel Mode (If LAN doesn't work)

If you're on different networks or behind a firewall:

```bash
# Stop the current server (Ctrl+C)
npx expo start --tunnel
```

This creates a public URL that works from anywhere. Scan the new QR code with **Expo Go app**.

---

## Solution 3: Manually Enter Connection URL

### In Expo Go app:
1. Look at your terminal where Expo is running
2. Find the connection URL (looks like: `exp://192.168.1.xxx:8081`)
3. In Expo Go app:
   - iOS: Tap "Enter URL manually" → paste the URL
   - Android: Tap "Enter URL manually" → paste the URL

### How to find the URL:
Press `m` in your terminal to open the menu, then look for the connection URL.

---

## Solution 4: Check Network Connection

### Make sure your computer and phone are on the same network:

1. **Computer and phone on same WiFi?**
   - Both must be on the same WiFi network
   - Corporate/Hotel WiFi may block device communication

2. **Try mobile hotspot:**
   - Turn on mobile hotspot on your phone
   - Connect your computer to your phone's hotspot
   - Restart Expo: `npx expo start --clear`

---

## Solution 5: Development Build (Most Reliable)

Since your app uses custom native modules, a development build is recommended:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Build development app for your device
# For iOS:
eas build --profile development --platform ios

# For Android:
eas build --profile development --platform android
```

After the build completes:
- **iOS:** Download from TestFlight
- **Android:** Download the `.apk` directly to your phone

---

## Quick Checklist

- [ ] Using **Expo Go app** (not phone camera)
- [ ] Phone and computer on **same WiFi**
- [ ] Tried **tunnel mode** (`npx expo start --tunnel`)
- [ ] Tried **manually entering URL** in Expo Go
- [ ] Checked that **firewall isn't blocking** port 8081

---

## Still Not Working?

### Option A: Use Web Version
```bash
npx expo start --web
```
Opens in your browser for quick testing.

### Option B: Use Emulator/Simulator

**iOS Simulator (Mac only):**
```bash
npx expo start --ios
```

**Android Emulator:**
```bash
npx expo start --android
```

---

## Most Common Mistakes

1. ❌ Using iPhone camera app instead of Expo Go
2. ❌ Computer and phone on different WiFi networks
3. ❌ Corporate WiFi blocking device communication
4. ❌ Firewall blocking port 8081
5. ❌ VPN interfering with local network

---

## For Your Specific Setup

Based on your app configuration, you have:
- Custom native modules (biometric auth, camera, notifications)
- Stripe integration
- Deep linking

**Recommendation:** Build a development client for the best experience:

```bash
# This creates a custom Expo Go with your native dependencies
eas build --profile development --platform all
```

This takes ~15-20 minutes but provides:
- ✅ No QR code issues
- ✅ All native features work
- ✅ Faster reload times
- ✅ Better debugging

---

## Need Help?

1. Check Expo status: https://status.expo.dev/
2. Expo Discord: https://chat.expo.dev/
3. Check your terminal for any error messages
