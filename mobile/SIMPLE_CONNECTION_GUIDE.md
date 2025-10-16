# Simple Guide: Connect Your Phone to Expo

## The Easiest Way (Works 99% of the time)

### Step 1: Make Sure You Have Expo Go
- **iPhone:** Download from App Store
- **Android:** Download from Google Play
- Search for "Expo Go" (official app by Expo)

### Step 2: Connect to Same WiFi
- Your phone and computer MUST be on the same WiFi network
- Check both devices are connected to the exact same network name

### Step 3: Start Expo in LAN Mode
```bash
cd mobile
npx expo start --clear
```

### Step 4: In Expo Go App
1. Open Expo Go
2. Tap "Scan QR Code" (it's right on the home screen)
3. Point at the QR code in your terminal
4. Wait for it to load

---

## If That Doesn't Work: Manual Connection

### Get Your Connection URL:
In your terminal where Expo is running, you'll see something like:
```
› Metro waiting on exp://192.168.1.100:8081
```

### In Expo Go:
1. Look for "Enter URL manually" or tap the URL icon
2. Type: `exp://192.168.1.100:8081` (use YOUR IP from terminal)
3. Press Go/Connect

---

## Still Not Working? Try This:

### Option 1: Use Your Computer's IP Address
```bash
# Find your IP address:
# Windows:
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

Then in Expo Go, manually enter:
```
exp://YOUR_IP_ADDRESS:8081
```

### Option 2: Use Tunnel Mode (Slower but More Reliable)
```bash
cd mobile
npx expo start --tunnel
```

This creates a public URL that works from anywhere. Scan the new QR code.

---

## Common Issues:

### "No usable data found"
- ❌ You're using your phone's camera app
- ✅ Use Expo Go's built-in scanner

### "Could not connect"
- ❌ Phone and computer on different WiFi
- ✅ Connect both to same network

### "Network error"
- ❌ Firewall blocking port 8081
- ✅ Try tunnel mode: `npx expo start --tunnel`

---

## Quick Checklist:

- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same WiFi
- [ ] Expo server running (`npx expo start`)
- [ ] Using Expo Go's scanner (not phone camera)
- [ ] QR code visible in terminal

---

## Need to See the QR Code Bigger?

Press `Shift + M` in your terminal for more options, or check if a browser window opened with the QR code.

---

## The Nuclear Option (If Nothing Works):

Build a development client:
```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Download the APK to your phone and install it. Then you don't need QR codes at all!
