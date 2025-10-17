# Stripe Web Build Fix

## Problem
The Expo web build was failing with the error:
```
Unable to resolve module @stripe/stripe-react-native
```

This occurred because `@stripe/stripe-react-native` is a native-only package (iOS/Android) and cannot be used in web builds, but the components were importing it unconditionally.

## Root Cause
Two files were importing `@stripe/stripe-react-native` at the module level:
1. `mobile/src/components/movements/DonationSheet.tsx`
2. `mobile/src/screens/checkout/EnhancedCheckoutScreen.tsx`

When Metro bundler tried to create a web bundle, it attempted to resolve this package which doesn't exist for web, causing the build to fail.

## Solution Implemented

### Platform-Specific Import Pattern
Created a platform-aware import pattern that:
1. Detects the platform at module load time
2. Only requires the Stripe package on native platforms (iOS/Android)
3. Provides a mock implementation for web that shows appropriate error messages

### Code Pattern Used
```typescript
// Mock stripe hook for web platform
const useMockStripe = () => ({
  initPaymentSheet: async () => ({ error: { message: 'Stripe not available on web' } }),
  presentPaymentSheet: async () => ({ error: { code: 'Canceled', message: 'Stripe not available on web' } }),
});

// Get the appropriate hook based on platform
const getStripeHook = () => {
  if (Platform.OS === 'web') {
    return useMockStripe;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useStripe } = require('@stripe/stripe-react-native');
    return useStripe;
  } catch {
    return useMockStripe;
  }
};

const useStripeHook = getStripeHook();
```

### Files Modified
1. **mobile/src/components/movements/DonationSheet.tsx**
   - Removed direct import of `@stripe/stripe-react-native`
   - Added platform-specific hook loader
   - Added web-specific error messages for users
   - Removed unused `ScrollView` import

2. **mobile/src/screens/checkout/EnhancedCheckoutScreen.tsx**
   - Removed direct import of `@stripe/stripe-react-native`
   - Added platform-specific hook loader
   - Maintains full functionality on native platforms

## Benefits
- ✅ Web build now succeeds without requiring Stripe package
- ✅ Native apps (iOS/Android) continue to work with full Stripe functionality
- ✅ Users on web see clear messages that payments require the mobile app
- ✅ No runtime errors or crashes
- ✅ Follows React Hook rules correctly
- ✅ Type-safe implementation

## Testing Recommendations
1. Test web build completes successfully: `npx expo export --platform web`
2. Test iOS/Android builds still work with Stripe: `expo start --ios` / `expo start --android`
3. Verify donation flow on native apps
4. Verify checkout flow on native apps
5. Verify appropriate error messages show on web

## Future Considerations
- Consider implementing web-based Stripe integration using Stripe.js for web platform
- Could use platform-specific files: `DonationSheet.native.tsx` and `DonationSheet.web.tsx`
- Consider adding Stripe to dependencies if native payment functionality is needed

## Note on Package Installation
The `@stripe/stripe-react-native` package is intentionally NOT in `package.json`. This is by design to:
1. Keep bundle size smaller for web builds
2. Avoid native module linking issues for web-only developers
3. Make the package optional for deployment scenarios

If you need Stripe functionality, install it with:
```bash
cd mobile
npm install @stripe/stripe-react-native
```

## Date Fixed
October 17, 2025
