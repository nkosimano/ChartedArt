# Complete Android SDK Setup Guide

## 🔍 Current Status

I've checked your system and found:
- ⚠️ Android Studio folder exists but is **EMPTY**
- ⚠️ Android SDK folder exists but is **EMPTY**

**This means you need to complete the Android Studio installation.**

---

## 📋 Step-by-Step Instructions

### **Step 1: Install Android Studio Properly**

#### 1.1 Download Android Studio
1. Go to: **https://developer.android.com/studio**
2. Click **"Download Android Studio"**
3. Save the file (1-2 GB)

#### 1.2 Run the Installer
1. Find the downloaded file: `android-studio-xxx-windows.exe`
2. **Right-click** → **"Run as Administrator"**
3. Click **"Next"** on the welcome screen
4. Make sure **ALL components are checked**:
   - ✅ Android Studio
   - ✅ Android Virtual Device
5. Click **"Next"**
6. Installation location: `C:\Program Files\Android\Android Studio` (default is fine)
7. Click **"Install"**
8. Wait 10-15 minutes
9. Click **"Finish"**

#### 1.3 Complete First-Time Setup (CRITICAL!)
1. Android Studio will launch
2. Select **"Do not import settings"** → Click **"OK"**
3. Click **"Next"** on the welcome screen
4. Choose **"Standard"** installation type → Click **"Next"**
5. Select your theme (Light or Dark) → Click **"Next"**
6. **Review settings** → Click **"Next"**
7. Click **"Finish"**

**⏳ NOW WAIT!** Android Studio will download:
- Android SDK (3-5 GB)
- Platform Tools
- Build Tools
- Emulator
- System Images

**This takes 20-40 minutes. DO NOT close Android Studio until it says "Download Complete"**

---

### **Step 2: Verify SDK Installation**

#### 2.1 Check SDK Location in Android Studio
1. Open Android Studio
2. Click **"More Actions"** → **"SDK Manager"**
   - OR: Go to **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Look at the top: **"Android SDK Location"**
4. It should show: `C:\Users\dhliso\AppData\Local\Android\Sdk`
5. Verify that **SDK Platforms** tab shows installed Android versions
6. Verify that **SDK Tools** tab shows:
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
   - ✅ Intel x86 Emulator Accelerator (HAXM installer)

If any are missing, check them and click **"Apply"** to install.

---

### **Step 3: Set Environment Variables**

#### Option A: Use My Automated Script (Easiest)

1. Open PowerShell **as Administrator**:
   - Press **Windows Key**
   - Type **"PowerShell"**
   - Right-click **"Windows PowerShell"**
   - Click **"Run as administrator"**

2. Navigate to the mobile folder:
   ```powershell
   cd C:\Users\dhliso\Development\ChartedArt\mobile
   ```

3. Run the setup script:
   ```powershell
   .\setup-android-env.ps1
   ```

4. If you get an error about execution policy:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\setup-android-env.ps1
   ```

#### Option B: Set Manually (Traditional Way)

1. Press **Windows + R**
2. Type: `sysdm.cpl`
3. Press **Enter**
4. Go to **"Advanced"** tab
5. Click **"Environment Variables..."**

**Add ANDROID_HOME:**
1. Under **"User variables"**, click **"New..."**
2. Variable name: `ANDROID_HOME`
3. Variable value: `C:\Users\dhliso\AppData\Local\Android\Sdk`
4. Click **"OK"**

**Update PATH:**
1. Under **"User variables"**, find **"Path"**
2. Click **"Edit..."**
3. Click **"New"** and add: `%ANDROID_HOME%\platform-tools`
4. Click **"New"** and add: `%ANDROID_HOME%\emulator`
5. Click **"New"** and add: `%ANDROID_HOME%\tools`
6. Click **"OK"** on all windows

---

### **Step 4: Restart Everything**

**CRITICAL STEP - Don't skip this!**

1. Close **ALL** PowerShell/Terminal windows
2. Close **VS Code** (if open)
3. Close **Android Studio** (if open)
4. **Restart your computer** (recommended) OR just open fresh terminals

---

### **Step 5: Verify the Setup**

Open a **NEW** PowerShell window and run:

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME
# Should output: C:\Users\dhliso\AppData\Local\Android\Sdk

# Check adb
adb version
# Should output: Android Debug Bridge version x.x.x

# List available emulators
emulator -list-avds
# Should list any virtual devices you created
```

**If you see version numbers and no errors, you're good!** ✅

**If you see "not recognized" errors:**
- Environment variables weren't set correctly
- You didn't restart your terminal
- Android SDK isn't fully installed

---

### **Step 6: Create a Virtual Device**

1. Open Android Studio
2. Click **"More Actions"** → **"Virtual Device Manager"**
3. Click **"Create Device"**
4. Select **"Pixel 5"** or **"Pixel 6"**
5. Click **"Next"**
6. Select a system image (if not downloaded, click "Download"):
   - Recommended: **"Tiramisu"** (API 33, Android 13)
   - Or: **"UpsideDownCake"** (API 34, Android 14)
7. Click **"Next"**
8. Name it: "Pixel_5_API_33"
9. Click **"Finish"**

---

### **Step 7: Test with Expo**

```powershell
cd C:\Users\dhliso\Development\ChartedArt\mobile
npx expo start
```

When Expo starts, press **`a`** to launch on Android.

The emulator should start automatically and your app will install!

---

## 🆘 Troubleshooting

### "Android SDK folder is empty"
**Problem:** Android Studio didn't download SDK components

**Solution:**
1. Open Android Studio
2. Go to SDK Manager
3. Install missing components
4. Wait for downloads to complete

### "adb not recognized"
**Problem:** Environment variables not set or terminal not restarted

**Solution:**
1. Run the setup script again
2. **Restart your computer**
3. Try again

### "Emulator won't start"
**Problem:** Virtualization not enabled or HAXM not installed

**Solution:**
1. Enable virtualization in BIOS
2. In Android Studio SDK Manager, install "Intel x86 Emulator Accelerator (HAXM)"

### "Expo can't connect to emulator"
**Problem:** Port forwarding issue

**Solution:**
```powershell
adb reverse tcp:8081 tcp:8081
npx expo start
# Press 'a'
```

---

## 📊 Checklist

Before asking for help, verify:

- [ ] Android Studio fully installed (not just the folder)
- [ ] SDK Manager shows installed SDK platforms and tools
- [ ] ANDROID_HOME environment variable set
- [ ] PATH includes platform-tools, emulator, and tools
- [ ] Terminal/IDE restarted after setting variables
- [ ] `adb version` works in new terminal
- [ ] At least one virtual device created
- [ ] Emulator can start from Android Studio

---

## ⏱️ Time Required

- Android Studio installation: **30-60 minutes**
- Environment setup: **5 minutes**
- Virtual device creation: **10-15 minutes**
- **Total: 45-75 minutes**

---

## 💡 Quick Tip

If this seems like too much work, remember:
- **Expo Go on your phone takes 2 minutes to set up**
- **No SDK, no emulator, no environment variables needed**
- **Just scan a QR code and start developing**

The emulator is useful but not required for Expo development!

---

## 🚀 Next Steps

Once everything is set up:
1. Start Expo: `npx expo start`
2. Press `a` for Android
3. Wait for emulator to boot
4. Your app will install and run!

Good luck! 🎉
