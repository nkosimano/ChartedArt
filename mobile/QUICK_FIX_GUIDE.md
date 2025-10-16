# Quick Fix Guide - Get Your App Running Now!

## 🎯 Goal
Remove dependencies that don't work with Expo Go and get your app running.

## ⚡ 5-Minute Fix

### Step 1: Edit `mobile/App.js`

Open the file and make these 3 changes:

#### Change 1: Remove Stripe import (around line 5)
```javascript
// DELETE THIS LINE:
import { StripeProvider } from '@stripe/stripe-react-native';
```

#### Change 2: Remove notification import (around line 20)
```javascript
// DELETE THIS LINE:
import { usePushNotifications } from './src/hooks/usePushNotifications';
```

#### Change 3: Remove notification call (around line 30)
```javascript
// Inside RootNavigator function, DELETE THIS LINE:
usePushNotifications(!!user);
```

#### Change 4: Remove StripeProvider wrapper (around lines 118-124)
```javascript
// BEFORE:
export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </StripeProvider>
  );
}

// AFTER:
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
```

### Step 2: Reinstall Dependencies

```bash
cd mobile
npm install
```

### Step 3: Start the App

```bash
npm start
```

---

## 🔧 If You Still Get Errors

The app might reference other files that use the removed packages. Here's how to fix them:

### Error: "Cannot find module 'expo-notifications'"

**File:** `mobile/src/hooks/usePushNotifications.ts`

**Quick Fix:** Replace the entire file content with this stub:

```typescript
// Stubbed version - push notifications disabled
export function usePushNotifications(enabled: boolean) {
  console.log('Push notifications are disabled (requires Apple Developer account)');
  return {
    token: null,
    permissionStatus: 'unavailable',
    error: 'Push notifications require Apple Developer account',
  };
}
```

### Error: "Cannot find module '@stripe/stripe-react-native'"

**Files that might cause this:**
- `mobile/src/screens/checkout/EnhancedCheckoutScreen.tsx`
- `mobile/src/components/movements/DonationSheet.tsx`

**Quick Fix Option 1:** Comment out the entire file (if you don't need checkout yet)

**Quick Fix Option 2:** Replace Stripe imports with a placeholder:

```typescript
// At the top of the file, replace:
// import { useStripe } from '@stripe/stripe-react-native';

// With this stub:
const useStripe = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ 
    error: { message: 'Payments require custom build' } 
  }),
});
```

---

## 📊 What Was Removed?

| Package | Why Removed | Alternative |
|---------|-------------|-------------|
| `@stripe/stripe-react-native` | Requires custom native build | Use web-based Stripe Checkout |
| `expo-notifications` | Requires Apple Developer account | Use in-app notification center |

---

## ✅ Success Checklist

- [ ] Edited `mobile/App.js` (removed 4 things)
- [ ] Ran `npm install` in mobile directory
- [ ] App starts without errors
- [ ] Can see the app in Expo Go

---

## 📚 More Information

- **Full details:** See `DEPENDENCY_REMOVAL_SUMMARY.md`
- **File-by-file guide:** See `FILES_TO_UPDATE.md`
- **Why removed:** See `REMOVED_DEPENDENCIES.md`

---

## 🆘 Still Stuck?

1. Make sure you're in the `mobile` directory
2. Delete `node_modules` and run `npm install` again
3. Check that `package.json` doesn't have the removed packages
4. Look for any red error messages and search for the filename in `FILES_TO_UPDATE.md`

---

## 🎉 Once It's Working

Your app will run in Expo Go without needing:
- Apple Developer account
- Custom native builds
- EAS Build credits

You can develop and test on real devices using the Expo Go app!

