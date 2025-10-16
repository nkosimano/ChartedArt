# Quick Fix Guide - Common Errors

## 🚨 Error: "Unable to resolve module"

### Symptoms
```
Unable to resolve "@package-name" from "src/..."
```

### Quick Fix
```powershell
cd mobile
npm install @package-name
npx expo start --clear
```

### If That Doesn't Work
```powershell
# Check peer dependencies
npm info @package-name peerDependencies

# Update peer dependencies first
npm install peer-dependency-name@required-version

# Then install the package
npm install @package-name

# Clear cache and restart
npx expo start --clear
```

---

## 🚨 Error: "Bundling failed" or Cache Issues

### Quick Fix
```powershell
cd mobile

# Clear Expo cache
Remove-Item -Recurse -Force .expo

# Clear Metro cache
npx expo start --clear
```

### Nuclear Option (if above doesn't work)
```powershell
cd mobile

# Remove all caches and node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall everything
npm install

# Start fresh
npx expo start --clear
```

---

## 🚨 Error: Duplicate Key in Object Literal

### Symptoms
```
warning: Duplicate key "keyname" in object literal
```

### Quick Fix
1. Open the file mentioned in the error
2. Search for the duplicate key
3. Remove one occurrence
4. Save - HMR will update automatically

---

## 🚨 Error: Peer Dependency Conflict

### Symptoms
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer react-native-reanimated@">=3.16.0"
```

### Quick Fix
```powershell
# Update the peer dependency first
npm install peer-dependency-name@latest

# Then install your package
npm install @your-package

# Or use legacy peer deps (not recommended)
npm install --legacy-peer-deps
```

---

## 🚨 Error: Port Already in Use

### Symptoms
```
Port 8081 is being used by another process
```

### Quick Fix
Just press `Y` when asked to use a different port.

### Or Kill the Process
```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Restart
npx expo start
```

---

## 🚨 Error: Module Not Found (Web App)

### Symptoms
```
Failed to resolve import "../path/to/module"
```

### Quick Fix
1. Check the import path is correct
2. Check the file exists
3. Check the file extension (.ts vs .tsx)
4. Restart Vite dev server

```powershell
# Stop the server (Ctrl+C)
# Restart
npm run dev
```

---

## 🚨 Error: TypeScript Errors

### Quick Check
```powershell
# Web app
npx tsc --noEmit

# Mobile app
cd mobile
npx tsc --noEmit
```

### Common Fixes
1. Install missing type definitions
```powershell
npm install --save-dev @types/package-name
```

2. Update tsconfig.json if needed
3. Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "Restart TS Server")

---

## 🚨 Error: Babel Plugin Issues

### Symptoms
```
Error: Cannot find module 'babel-plugin-...'
```

### Quick Fix
```powershell
npm install --save-dev babel-plugin-name
```

### For react-native-reanimated
Make sure babel.config.js has:
```javascript
plugins: [
  // ... other plugins
  'react-native-reanimated/plugin'  // Must be last!
]
```

---

## 🚨 Error: Environment Variables Not Loading

### Quick Fix
```powershell
# Mobile app
cd mobile

# Check .env file exists
cat .env

# Restart with clear cache
npx expo start --clear
```

### Web App
```powershell
# Check .env file exists
cat .env

# Restart Vite
npm run dev
```

---

## 📋 Maintenance Commands

### Check for Issues
```powershell
# Check outdated packages
npm outdated

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Update Dependencies
```powershell
# Update all packages (careful!)
npm update

# Update specific package
npm install package-name@latest

# Update Expo SDK
npx expo install --fix
```

### Clean Everything
```powershell
# Mobile app
cd mobile
Remove-Item -Recurse -Force .expo, node_modules
Remove-Item package-lock.json
npm install

# Web app
cd ..
Remove-Item -Recurse -Force node_modules, .vite
Remove-Item package-lock.json
npm install
```

---

## 🔍 Debugging Tips

### Check What's Installed
```powershell
# List all packages
npm list --depth=0

# Check specific package
npm list package-name

# Check package info
npm info package-name
```

### Check Logs
```powershell
# Metro bundler logs (mobile)
# Already visible in terminal

# Vite logs (web)
# Already visible in terminal

# NPM logs (if install fails)
cat C:\Users\USERNAME\AppData\Local\npm-cache\_logs\*-debug-0.log
```

### Check Ports
```powershell
# See what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :8081
netstat -ano | findstr :8083
```

---

## ⚡ Quick Start After Errors Fixed

### Mobile App
```powershell
cd mobile
npx expo start --clear
```

### Web App
```powershell
npm run dev
```

### Both Apps
```powershell
# Terminal 1 - Web app
npm run dev

# Terminal 2 - Mobile app
cd mobile
npm start
```

---

## 📞 When to Ask for Help

Ask for help if:
1. Error persists after trying quick fixes
2. Multiple errors appear at once
3. Error message is unclear
4. Build succeeds but app crashes at runtime
5. You're not sure what the error means

---

## ✅ Success Indicators

You know it's working when:
- ✅ No red error messages in terminal
- ✅ QR code appears (mobile)
- ✅ "ready in Xms" message (web)
- ✅ No TypeScript errors
- ✅ App loads in browser/device

---

## 🎯 Most Common Issues (In Order)

1. **Missing dependencies** → `npm install package-name`
2. **Cache issues** → `npx expo start --clear`
3. **Port conflicts** → Press Y for different port
4. **Peer dependency conflicts** → Update peer deps first
5. **Stale imports** → Check file paths and extensions

---

**Remember:** Most errors are fixed by:
1. Installing missing packages
2. Clearing cache
3. Restarting the dev server

**When in doubt:** Clear cache and restart! 🔄

