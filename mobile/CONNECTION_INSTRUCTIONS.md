# 📱 How to Connect Your Phone to Expo

## ✅ Your Expo Server is Running!

The server is active and waiting for your phone to connect.

---

## 🔍 Finding the Connection Information

### Look at Your Terminal

In your terminal/PowerShell window where you ran `npx expo start`, you should see:

1. **A QR Code** (made of squares/blocks) - looks like this:
```
█▀▀▀▀▀█ ▀▀█▄█ █▀▀▀▀▀█
█ ███ █ ▄▀▄  █ ███ █
█ ▀▀▀ █ █▀ ▀ █ ▀▀▀ █
```

2. **Connection URLs** - looks like this:
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

## 📱 How to Connect

### Method 1: Scan QR Code (Easiest)

**On iPhone:**
1. Open **Expo Go** app (not Camera app!)
2. Tap **"Scan QR Code"**
3. Point at the QR code in your terminal
4. Wait for app to load

**On Android:**
1. Open **Expo Go** app (not Camera app!)
2. Tap **"Scan QR Code"**
3. Point at the QR code in your terminal
4. Wait for app to load

### Method 2: Manual URL Entry (If QR doesn't work)

1. Look at your terminal for the line that says:
   ```
   › Metro waiting on exp://192.168.x.x:8081
   ```

2. Copy that URL (e.g., `exp://192.168.1.100:8081`)

3. In Expo Go app:
   - Tap **"Enter URL manually"**
   - Paste the URL
   - Tap "Connect"

---

## 🚨 "No Usable Data" Error?

This error means one of these issues:

### Issue 1: Using Wrong App to Scan
❌ **WRONG:** Using your phone's Camera app  
✅ **CORRECT:** Using Expo Go app's built-in scanner

**Solution:**
- Close Camera app
- Open **Expo Go** app
- Use the "Scan QR Code" button **inside Expo Go**

### Issue 2: QR Code Not Visible
The QR code might not be showing in your terminal.

**Solution:**
- Press **`Shift + M`** in your terminal to show menu
- Or check if a browser window opened with the QR code
- Or use Method 2 (manual URL entry) above

### Issue 3: Different WiFi Networks
Your phone and computer must be on the **same WiFi network**.

**Solution:**
- Check computer WiFi: Settings → Network
- Check phone WiFi: Settings → WiFi
- Make sure they're the exact same network name

### Issue 4: Firewall Blocking Connection
Windows Firewall might be blocking the connection.

**Solution:**
```bash
# Stop Expo (Ctrl+C)
# Then restart with tunnel mode:
npx expo start --tunnel
```

Tunnel mode creates a public URL that bypasses network issues.

---

## 🔧 Quick Fixes

### Fix 1: Restart Expo with Tunnel Mode
```bash
# Press Ctrl+C to stop current server
npx expo start --tunnel
```

This creates a public URL that works from anywhere.

### Fix 2: Clear Cache and Restart
```bash
npx expo start --clear
```

### Fix 3: Check if Server is Actually Running
In your terminal, you should see:
- ✅ "Starting Metro Bundler"
- ✅ "Metro waiting on exp://..."
- ✅ A QR code

If you don't see these, the server didn't start properly.

---

## 📋 Connection Checklist

Before scanning, verify:

- [ ] Expo server is running (`npx expo start`)
- [ ] You can see a QR code in your terminal
- [ ] Expo Go app installed on your phone
- [ ] Phone and computer on **same WiFi**
- [ ] Using **Expo Go's scanner** (not phone camera)
- [ ] No VPN active on computer or phone

---

## 🎯 Step-by-Step Right Now

### Step 1: Check Your Terminal
Look at the terminal where you ran `npx expo start`.

**Do you see a QR code?**
- ✅ **YES** → Go to Step 2
- ❌ **NO** → Press `Shift + M` or restart: `npx expo start --clear`

### Step 2: Open Expo Go on Your Phone
- Download from App Store (iPhone) or Google Play (Android)
- Open the app

### Step 3: Scan QR Code
- In Expo Go, tap **"Scan QR Code"**
- Point at the QR code in your terminal
- Wait 5-10 seconds

### Step 4: Wait for App to Load
- First load takes 30-60 seconds
- You'll see "Building JavaScript bundle"
- Then your app appears!

---

## 🆘 Still Getting "No Usable Data"?

### Try This:

1. **Use Manual URL Entry Instead:**
   - Find the `exp://` URL in your terminal
   - In Expo Go, tap "Enter URL manually"
   - Type the URL exactly
   - Press Connect

2. **Use Tunnel Mode:**
   ```bash
   npx expo start --tunnel
   ```
   - This creates a different type of connection
   - Scan the new QR code
   - Works even on different networks

3. **Check Network:**
   - Turn off VPN on computer and phone
   - Connect both to same WiFi
   - Restart Expo: `npx expo start --clear`

---

## 💡 Pro Tip: See the QR Code in Browser

When you run `npx expo start`, it might open a browser window automatically with:
- A larger QR code
- Connection instructions
- Device logs

If it didn't open, press **`Shift + M`** in terminal and select "Open in browser"

---

## 🎊 Once Connected

After your first successful connection:
- Changes auto-reload when you save files
- Shake phone to open developer menu
- Logs appear in your terminal
- Fast refresh = instant updates

---

**Your Expo server is ready! Just scan the QR code with Expo Go app (not your camera app)!** 📱✨
