# Android Emulator Setup Guide

## Step-by-Step Installation

### Step 1: Download Android Studio

1. Go to: https://developer.android.com/studio
2. Click **"Download Android Studio"**
3. Accept the terms and download (approximately 1-2 GB)
4. Wait for download to complete

### Step 2: Install Android Studio

1. Run the downloaded installer (`android-studio-xxx-windows.exe`)
2. Click **"Next"** through the setup wizard
3. Choose **"Standard"** installation type
4. Select a theme (doesn't matter which)
5. Click **"Finish"** and wait for components to download (this takes 10-30 minutes)

### Step 3: Install Android SDK

During the first launch, Android Studio will download:
- Android SDK
- Android SDK Platform
- Android Virtual Device (AVD)
- Intel x86 Emulator Accelerator (HAXM) or Hyper-V

**Just wait for everything to finish downloading and installing.**

### Step 4: Create a Virtual Device

1. Open Android Studio
2. Click **"More Actions"** → **"Virtual Device Manager"**
3. Click **"Create Device"**
4. Select a device (recommended: **Pixel 5** or **Pixel 6**)
5. Click **"Next"**
6. Select a system image:
   - Recommended: **"Tiramisu"** (Android 13) or **"UpsideDownCake"** (Android 14)
   - Click **"Download"** next to the system image
   - Wait for download to complete
7. Click **"Next"**
8. Give it a name (e.g., "Pixel 5 API 33")
9. Click **"Finish"**

### Step 5: Set Environment Variables

#### On Windows:

1. Press **Windows Key** and type **"environment variables"**
2. Click **"Edit the system environment variables"**
3. Click **"Environment Variables..."** button
4. Under **"User variables"**, click **"New..."**

**Add ANDROID_HOME:**
- Variable name: `ANDROID_HOME`
- Variable value: `C:\Users\nathi\AppData\Local\Android\Sdk`
- Click **"OK"**

**Add to Path:**
1. Find **"Path"** in User variables
2. Click **"Edit..."**
3. Click **"New"** and add: `%ANDROID_HOME%\platform-tools`
4. Click **"New"** and add: `%ANDROID_HOME%\emulator`
5. Click **"New"** and add: `%ANDROID_HOME%\tools`
6. Click **"OK"** on all windows

### Step 6: Restart Your Terminal

**IMPORTANT:** Close ALL terminal/PowerShell windows and reopen them for the environment variables to take effect.

### Step 7: Verify Installation

Open a new PowerShell/Terminal and run:

```bash
# Check if adb is recognized
adb version

# Check if emulator is recognized
emulator -list-avds
```

You should see your virtual device listed.

### Step 8: Start the Emulator

**Option A: From Android Studio**
1. Open Android Studio
2. Click **"Virtual Device Manager"**
3. Click the **Play button** next to your device
4. Wait for emulator to boot (first time takes 2-5 minutes)

**Option B: From Command Line**
```bash
# List available devices
emulator -list-avds

# Start the emulator (replace with your AVD name)
emulator -avd Pixel_5_API_33
```

### Step 9: Run Your Expo App

Once the emulator is running:

```bash
cd mobile
npx expo start
```

Then press **`a`** to open on Android emulator.

---

## Troubleshooting

### "HAXM installation failed"

**Solution:** Enable virtualization in BIOS or use Hyper-V

1. Restart computer
2. Enter BIOS (usually F2, F10, or Del during startup)
3. Find "Virtualization" or "Intel VT-x" setting
4. Enable it
5. Save and restart

### "Emulator is slow"

**Solutions:**
- Allocate more RAM to the emulator (edit AVD settings)
- Enable hardware acceleration
- Use a newer system image (ARM64 images are faster on some systems)

### "adb not recognized"

**Solution:** Environment variables not set correctly

1. Verify ANDROID_HOME is set to: `C:\Users\nathi\AppData\Local\Android\Sdk`
2. Verify Path includes platform-tools
3. Restart terminal completely

### "Expo app won't connect to emulator"

**Solution:**
```bash
# In your terminal
adb reverse tcp:8081 tcp:8081
npx expo start
# Press 'a' for Android
```

---

## Estimated Time

- Download Android Studio: 5-15 minutes
- Install Android Studio: 10-30 minutes
- Download system image: 5-10 minutes
- First emulator boot: 2-5 minutes
- **Total: 30-60 minutes**

---

## System Requirements

- **RAM:** 8GB minimum (16GB recommended)
- **Disk Space:** 10GB+ free space
- **CPU:** Intel/AMD with virtualization support
- **OS:** Windows 10/11 64-bit

---

## Alternative: Use a Real Device

If this seems like too much work, remember you can:
1. Install Expo Go on your phone (2 minutes)
2. Scan QR code
3. Start developing immediately

**The emulator is slower and uses more resources than a real device.**

---

## Next Steps After Setup

Once your emulator is running:

```bash
cd C:\Users\nathi\OneDrive\Documents\Projects\ChartedArt\mobile
npx expo start
# Press 'a' when emulator is ready
```

Your app will install and run on the emulator!
