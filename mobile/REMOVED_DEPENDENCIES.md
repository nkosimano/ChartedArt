# Removed Dependencies

This document tracks dependencies that were removed from `package.json` due to constraints with Expo Go and the lack of a paid Apple Developer account.

## Dependencies Removed

### 1. `@stripe/stripe-react-native` (v0.50.3)

**Reason for Removal:**
- Requires custom native code (Swift/Objective-C) that is not included in Expo Go
- Needs a custom development build using EAS Build
- EAS Build requires a paid Apple Developer account ($99/year)
- Will cause native build errors and crashes when trying to use Stripe's native UI components or Apple Pay

**Impact:**
- Cannot process payments directly in the app
- Cannot use Stripe's native credit card input forms
- Cannot use Apple Pay integration

**Alternatives:**
- Use web-based payment flow with `expo-web-browser` to redirect to Stripe Checkout
- Implement server-side payment processing and use web views
- Consider other payment providers that offer web-only solutions

---

### 2. `expo-notifications` (v0.28.9)

**Reason for Removal:**
- Requires Apple Push Notification service (APNs) key from Apple Developer Portal
- APNs key can only be generated with a paid Apple Developer account
- While the package works in Expo Go for local testing, you cannot send real push notifications to physical devices without the APNs key

**Impact:**
- Cannot send push notifications to users on iOS devices
- Cannot receive remote notifications from your backend
- Can only test notifications in iOS Simulator (not real-world testing)

**Alternatives:**
- Use in-app notifications/alerts with local state management
- Use email or SMS notifications instead
- Implement a notification center within the app that users can check manually
- Consider web push notifications if you have a web version

---

## Dependencies That Are OK to Keep

These dependencies work fine in Expo Go and don't require a paid developer account:

### Heavy but Functional:
- **`expo-gl`** - Works in Expo Go, but complex 3D scenes may be slow (performance consideration, not a blocker)
- **`react-native-reanimated`** - Fully supported in Expo Go, great for high-performance animations

### Fully Supported:
- All other `expo-*` packages in your dependencies
- All `@react-navigation/*` packages
- `@supabase/supabase-js`
- `@gorhom/bottom-sheet`
- All other React Native core packages

---

## How to Re-enable These Features

If you later obtain a paid Apple Developer account ($99/year), you can:

1. **Re-add the dependencies:**
   ```bash
   npm install @stripe/stripe-react-native@0.50.3 expo-notifications@~0.28.9
   ```

2. **Create a custom development build:**
   ```bash
   eas build --profile development --platform ios
   ```

3. **Configure APNs for notifications:**
   - Generate an APNs key in Apple Developer Portal
   - Add the key to your Expo project configuration

4. **Configure Stripe:**
   - Set up your Stripe account
   - Add necessary configuration to `app.json`

---

## Notes

- This removal allows the app to run in Expo Go without crashes
- The app can still be developed and tested on physical devices using Expo Go
- Core functionality remains intact
- Payment and notification features will need alternative implementations

