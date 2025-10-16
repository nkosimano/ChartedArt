# Files That Need Updates After Dependency Removal

After removing `@stripe/stripe-react-native` and `expo-notifications` from package.json, the following files need to be updated to avoid import errors.

## 🚨 IMMEDIATE ACTION REQUIRED

**The app will NOT start until you fix `mobile/App.js`!**

### Quick Fix for App.js (Do This First!)

Replace lines 5, 20, 30, 118, and 124 in `mobile/App.js`:

**BEFORE:**
```javascript
import { StripeProvider } from '@stripe/stripe-react-native';  // Line 5 - REMOVE
import { usePushNotifications } from './src/hooks/usePushNotifications';  // Line 20 - REMOVE

function RootNavigator() {
  const { user, loading } = useAuth();
  usePushNotifications(!!user);  // Line 30 - REMOVE
  // ...
}

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>  {/* Line 118 - REMOVE */}
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </StripeProvider>  {/* Line 124 - REMOVE */}
  );
}
```

**AFTER:**
```javascript
// REMOVED: import { StripeProvider } from '@stripe/stripe-react-native';
// REMOVED: import { usePushNotifications } from './src/hooks/usePushNotifications';

function RootNavigator() {
  const { user, loading } = useAuth();
  // REMOVED: usePushNotifications(!!user);
  // ...
}

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

---

## ⚠️ Critical: Files Using Removed Dependencies

### 🔴 MOST CRITICAL: Main App File

**`mobile/App.js`** - **THIS WILL PREVENT THE APP FROM STARTING**
   - Line 5: `import { StripeProvider } from '@stripe/stripe-react-native';`
   - Line 20: `import { usePushNotifications } from './src/hooks/usePushNotifications';`
   - Line 30: `usePushNotifications(!!user);`
   - Line 118: `<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>`
   - Line 124: `</StripeProvider>`
   - **Action Required**:
     - Remove StripeProvider wrapper (or replace with Fragment)
     - Remove or stub usePushNotifications import and call
   - **Impact**: App will crash immediately on startup if not fixed
   - **Priority**: FIX THIS FIRST!

### Files Using `expo-notifications` (REMOVED)

1. **`mobile/src/hooks/usePushNotifications.ts`**
   - Line 2: `import * as Notifications from 'expo-notifications';`
   - **Action Required**: Stub this file to return mock data (see example below)
   - **Usage**: Used for push notification registration and handling
   - **Called by**: App.js (line 30)

2. **`mobile/src/lib/notifications/NotificationService.ts`**
   - Line 1: `import * as Notifications from 'expo-notifications';`
   - **Action Required**: Comment out or remove this entire file, or create a stub version
   - **Usage**: Service class for managing push notifications

### Files Using `@stripe/stripe-react-native` (REMOVED)

3. **`mobile/src/screens/checkout/EnhancedCheckoutScreen.tsx`**
   - Line 13: `import { useStripe } from '@stripe/stripe-react-native';`
   - Line 26: `const { initPaymentSheet, presentPaymentSheet } = useStripe();`
   - **Action Required**: Replace with web-based payment flow or stub the payment functionality
   - **Usage**: Main checkout screen with Stripe payment integration

4. **`mobile/src/components/movements/DonationSheet.tsx`**
   - Line 14: `import { useStripe } from '@stripe/stripe-react-native';`
   - **Action Required**: Replace with web-based payment flow or stub the donation functionality
   - **Usage**: Bottom sheet component for movement donations

---

## 📋 Recommended Actions

### Option 1: Stub Out the Functionality (Quick Fix)
Create stub/mock versions of these files that return placeholder data or show "Coming Soon" messages. This allows the app to compile and run without these features.

### Option 2: Remove Features Entirely
Comment out or remove the files and any navigation/routes that reference them. Update the app to hide payment and notification features.

### Option 3: Implement Web-Based Alternatives

#### For Payments (Stripe):
- Use `expo-web-browser` to redirect to Stripe Checkout (web-based)
- Process payments on your backend and return to the app
- Example flow:
  ```typescript
  import * as WebBrowser from 'expo-web-browser';
  
  const handlePayment = async () => {
    const checkoutUrl = await createCheckoutSession(); // Backend API call
    await WebBrowser.openBrowserAsync(checkoutUrl);
  };
  ```

#### For Notifications:
- Use in-app notification center (database-backed)
- Poll for new notifications periodically
- Show badge counts based on unread notifications in database
- Use local notifications for reminders (doesn't require APNs)

---

## 🔍 Files That May Reference These (Check for Errors)

These files might import or use the above components and may need updates:

- **`mobile/App.tsx`** - Main app file, may initialize notification service
- **`mobile/src/navigation/*`** - Navigation files that route to checkout/donation screens
- Any screen that navigates to `EnhancedCheckoutScreen`
- Any component that opens `DonationSheet`

---

## ✅ Next Steps

1. **Run the app** to see which files cause import errors:
   ```bash
   cd mobile
   npm start
   ```

2. **For each error**, choose one of the options above:
   - Stub it out (fastest)
   - Remove it (cleanest)
   - Replace with web alternative (most functional)

3. **Update navigation** to hide or disable features that depend on removed packages

4. **Test the app** to ensure it runs without crashes

---

## 💡 Example Stub Implementation

### Stub for `usePushNotifications.ts`:
```typescript
// Stubbed version - no actual push notifications
export function usePushNotifications(enabled: boolean) {
  return {
    token: null,
    permissionStatus: 'unavailable',
    error: 'Push notifications require Apple Developer account',
  };
}
```

### Stub for `useStripe` in checkout:
```typescript
// Replace Stripe hook with web-based payment
const handlePayment = async () => {
  Alert.alert(
    'Payment',
    'Redirecting to secure payment page...',
    [
      {
        text: 'Continue',
        onPress: async () => {
          const checkoutUrl = await apiClient.createCheckoutSession({
            items: cartItems,
            amount: totalAmount,
          });
          await WebBrowser.openBrowserAsync(checkoutUrl);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]
  );
};
```

---

## 📝 Notes

- The web version of your app can still use Stripe normally (it uses `@stripe/react-stripe-js` which is different)
- Push notifications can still work on Android without Apple Developer account (uses FCM)
- Consider feature flags to enable/disable these features based on platform or build type

