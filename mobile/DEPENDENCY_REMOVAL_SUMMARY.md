# Dependency Removal Summary

## ✅ What Was Done

### 1. Removed Problematic Dependencies from package.json

The following dependencies were **removed** from `mobile/package.json`:

- ❌ `@stripe/stripe-react-native` (v0.50.3)
- ❌ `expo-notifications` (v0.28.9)

These packages require:
- Custom native builds (not compatible with Expo Go)
- Apple Developer account ($99/year)
- APNs keys for push notifications

### 2. Created Documentation

Three new documentation files were created to help you proceed:

#### 📄 `REMOVED_DEPENDENCIES.md`
- Explains WHY each dependency was removed
- Lists the impact of removal
- Provides alternatives for each feature
- Instructions for re-enabling if you get an Apple Developer account

#### 📄 `FILES_TO_UPDATE.md`
- **CRITICAL**: Lists all files that import the removed packages
- Provides quick fix for `App.js` (MUST DO FIRST!)
- Shows exact line numbers and code changes needed
- Includes stub implementation examples
- Provides web-based alternatives

#### 📄 `DEPENDENCY_REMOVAL_SUMMARY.md` (this file)
- Overview of what was done
- Next steps to get your app running

---

## 🚨 CRITICAL: Next Steps to Get App Running

Your app **will not start** until you fix the import errors. Follow these steps in order:

### Step 1: Fix App.js (REQUIRED - Do This First!)

Open `mobile/App.js` and make these changes:

1. **Remove line 5:**
   ```javascript
   // DELETE THIS LINE:
   import { StripeProvider } from '@stripe/stripe-react-native';
   ```

2. **Remove line 20:**
   ```javascript
   // DELETE THIS LINE:
   import { usePushNotifications } from './src/hooks/usePushNotifications';
   ```

3. **Remove line 30 (inside RootNavigator function):**
   ```javascript
   // DELETE THIS LINE:
   usePushNotifications(!!user);
   ```

4. **Remove the StripeProvider wrapper (lines 118 and 124):**
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

After fixing App.js, reinstall your dependencies:

```bash
cd mobile
npm install
```

This will remove the deleted packages from `node_modules`.

### Step 3: Try Starting the App

```bash
npm start
```

If you see errors about other files, continue to Step 4.

### Step 4: Fix Remaining Import Errors (If Any)

If the app still won't start, you'll need to fix these files (see `FILES_TO_UPDATE.md` for details):

1. `mobile/src/hooks/usePushNotifications.ts` - Stub this file
2. `mobile/src/lib/notifications/NotificationService.ts` - Remove or stub
3. `mobile/src/screens/checkout/EnhancedCheckoutScreen.tsx` - Replace Stripe with web flow
4. `mobile/src/components/movements/DonationSheet.tsx` - Replace Stripe with web flow

---

## 📋 What Features Are Affected?

### ❌ Features That Won't Work:

1. **Native Stripe Payments**
   - Credit card input forms
   - Apple Pay
   - Native payment sheet

2. **Push Notifications**
   - Remote notifications from server
   - APNs-based alerts
   - Background notification handling

### ✅ Features That Still Work:

- All navigation
- Authentication (Supabase)
- Image picking and uploads
- Biometric authentication
- Haptic feedback
- 3D graphics (expo-gl)
- Animations (reanimated)
- All other Expo Go compatible features

### 🔄 Features You Can Replace:

1. **Payments** → Use web-based Stripe Checkout via `expo-web-browser`
2. **Notifications** → Use in-app notification center with database polling

---

## 💡 Alternative Implementation Ideas

### For Payments:

```typescript
import * as WebBrowser from 'expo-web-browser';

const handleCheckout = async () => {
  // Call your backend to create a Stripe Checkout session
  const response = await fetch('https://your-api.com/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cartItems }),
  });
  
  const { checkoutUrl } = await response.json();
  
  // Open Stripe Checkout in browser
  await WebBrowser.openBrowserAsync(checkoutUrl);
};
```

### For Notifications:

```typescript
// Poll for new notifications from your database
const useInAppNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false);
      
      setNotifications(data || []);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId]);
  
  return notifications;
};
```

---

## 🔮 Future: Re-enabling These Features

If you later get an Apple Developer account ($99/year), you can:

1. Re-add the dependencies:
   ```bash
   npm install @stripe/stripe-react-native@0.50.3 expo-notifications@~0.28.9
   ```

2. Create a custom development build:
   ```bash
   eas build --profile development --platform ios
   ```

3. Configure APNs keys in Apple Developer Portal

4. Restore the code changes you made in Step 1

---

## 📞 Need Help?

- See `FILES_TO_UPDATE.md` for detailed file-by-file instructions
- See `REMOVED_DEPENDENCIES.md` for why dependencies were removed
- Check Expo documentation for web-based alternatives
- Consider using feature flags to enable/disable features based on build type

---

## ✅ Summary Checklist

- [ ] Read this document
- [ ] Fix `mobile/App.js` (remove Stripe and notification imports)
- [ ] Run `npm install` in mobile directory
- [ ] Try starting the app with `npm start`
- [ ] Fix any remaining import errors using `FILES_TO_UPDATE.md`
- [ ] Test the app in Expo Go
- [ ] Implement web-based alternatives for payments/notifications (optional)

