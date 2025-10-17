# Web vs Mobile App Architecture - CRITICAL FIX

## 🚨 Problem Identified

You were seeing the **mobile app interface** on web instead of the **web app interface** because Amplify was configured to deploy the mobile app's web export.

## Project Architecture

ChartedArt has **TWO SEPARATE APPLICATIONS**:

### 1. Web Application (`/src/`)
- **Technology**: React + Vite + React Router
- **UI**: Radix UI components, Tailwind CSS
- **Purpose**: Full-featured web interface optimized for desktop/laptop browsers
- **Build Command**: `npm run build` (uses Vite)
- **Output**: `dist/` directory
- **Entry Point**: `src/main.tsx` → `src/App.tsx`
- **Routing**: React Router DOM with dedicated pages
- **Features**: 
  - Admin dashboard
  - Full gallery management
  - Events & competitions
  - Blog & movements
  - Checkout flow
  - Account management

### 2. Mobile Application (`/mobile/`)
- **Technology**: React Native + Expo
- **UI**: React Native components (optimized for touch)
- **Purpose**: Native mobile apps (iOS/Android) with web export capability
- **Build Command**: `npx expo export --platform web`
- **Output**: `mobile/dist/` directory
- **Entry Point**: `mobile/App.tsx`
- **Routing**: Expo Router or React Navigation
- **Features**: Mobile-optimized UI with touch interactions

## ⚙️ Configuration Changes Made

### Before (WRONG - Deployed Mobile App)
```yaml
# amplify.yml
frontend:
  phases:
    preBuild:
      commands:
        - cd mobile
        - npm install --legacy-peer-deps
    build:
      commands:
        - npx expo export --platform web
  artifacts:
    baseDirectory: mobile/dist  # ❌ Mobile app output
```

### After (CORRECT - Deploys Web App)
```yaml
# amplify.yml
frontend:
  phases:
    preBuild:
      commands:
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build  # ✅ Vite build for web app
  artifacts:
    baseDirectory: dist  # ✅ Web app output
```

## 🎯 What This Fixes

| Before | After |
|--------|-------|
| ❌ Mobile UI on web (React Native components) | ✅ Proper web UI (React components) |
| ❌ Touch-optimized interface on desktop | ✅ Desktop-optimized interface |
| ❌ Expo web bundle | ✅ Vite-optimized web bundle |
| ❌ Limited routing | ✅ Full React Router with all pages |
| ❌ No admin interface accessible | ✅ Complete admin dashboard |

## 📱 Mobile App Deployment

The mobile app should be deployed separately using:

### iOS/Android (Native Apps)
```bash
cd mobile
npx expo build:ios
npx expo build:android
# Or use EAS Build
eas build --platform ios
eas build --platform android
```

### Mobile Web (If Needed)
If you want to deploy the mobile web version separately:
1. Create a separate Amplify app or subdomain
2. Configure it to build from `mobile/` directory
3. Use the Expo web export command

## 🔍 How to Tell Which App Is Running

### Web App Signs:
- React Router URLs (e.g., `/gallery`, `/events`, `/admin/dashboard`)
- Radix UI components (dialogs, dropdowns with arrow navigation)
- Tailwind-styled interface
- Full navigation bar with multiple sections
- Admin interface accessible

### Mobile App Signs:
- Single-page navigation
- Touch-optimized buttons and spacing
- React Native components
- Bottom tab navigation
- Limited admin access

## 📋 Next Steps

1. **Commit the `amplify.yml` change**
2. **Push to trigger new Amplify build**
3. **Verify the web app deploys correctly**:
   - Check homepage loads properly
   - Navigate to `/gallery`, `/events`, `/admin/dashboard`
   - Verify all React components render
   - Test authentication flow

4. **For Mobile App** (separate deployment):
   - Use Expo Application Services (EAS)
   - Submit to App Store / Play Store
   - Or deploy mobile web version to a subdomain (e.g., `m.chartedart.com`)

## 🛠️ Development Commands

### Web App (Current Focus)
```bash
# Development
npm run dev              # Start Vite dev server on port 3000

# Production Build
npm run build            # Build for production → dist/

# Preview Build
npm run preview          # Preview production build locally
```

### Mobile App
```bash
# Development
cd mobile
npx expo start           # Start Expo dev server

# Web Preview
npx expo start --web     # Preview mobile web version

# Production Build
npx expo export --platform web   # Build web version
eas build --platform all         # Build native apps
```

## ✅ Files Modified
- `amplify.yml` - Changed from mobile app build to web app build

## 🎉 Expected Result

After deploying this change, your Amplify-hosted website will show the **proper web interface** with:
- Full desktop-optimized UI
- Complete admin dashboard
- All pages accessible via React Router
- Vite-optimized performance
- Proper SEO and metadata

The mobile app remains available for native development and can be deployed separately through app stores or as a separate web deployment.
