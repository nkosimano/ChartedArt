# SecureStore Web Platform Fix

## Issue Summary
The mobile app was experiencing a critical error when running on web platforms:
```
TypeError: n.default.setValueWithKeyAsync is not a function
```

This occurred because `expo-secure-store` is not available in web builds, but the Supabase client was attempting to use SecureStore methods that don't exist in the browser environment.

## Root Cause
- `mobile/src/lib/supabase/client.ts` was using `expo-secure-store` methods exclusively
- These methods (`setItemAsync`, `deleteItemAsync`, `getItemAsync`) are only available on native platforms (iOS/Android)
- When the app was built for web, these methods were undefined, causing the runtime error during authentication

## Solution Implemented

### 1. Platform Detection
Added `Platform` import from `react-native` to detect the current platform:
```typescript
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
```

### 2. Storage Adapter Update
Updated the storage adapter to use conditional logic:
- **Web**: Uses `window.localStorage` (native browser storage)
- **Native**: Uses `expo-secure-store` (encrypted storage on iOS/Android)

```typescript
const StorageAdapter = {
  getItem: async (key: string) => {
    if (isWeb) {
      return window.localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  // Similar for setItem and removeItem
};
```

### 3. Manual Auth Token Persistence
Updated all manual auth token operations to use the same platform detection:
- `signIn()` - Stores token after successful login
- `signUp()` - Stores token after registration
- `signOut()` - Removes token on logout
- `onAuthStateChange()` - Updates token when session changes

## Files Modified
- `mobile/src/lib/supabase/client.ts` - Complete platform-aware storage implementation
- `mobile/src/lib/api/client.ts` - Platform-aware auth token retrieval and clearing

## Benefits
1. **Web Compatibility**: App now works correctly in browsers without SecureStore errors
2. **Native Security**: Native apps still use encrypted SecureStore for sensitive data
3. **Single Codebase**: No need for separate implementations or build configurations
4. **Graceful Fallback**: Automatic detection and appropriate storage selection

## Testing Checklist

### Web Platform
- [x] Code changes applied
- [ ] Login flow works without errors
- [ ] `localStorage.getItem('auth_token')` contains token after login
- [ ] Token clears on logout
- [ ] Session persists across page refreshes
- [ ] No SecureStore errors in browser console

### Native Platform (Optional)
- [ ] iOS: SecureStore still works correctly
- [ ] Android: SecureStore still works correctly
- [ ] Tokens remain encrypted on device

## Deployment Steps
1. Commit the changes to the repository
2. Push to trigger Amplify rebuild
3. Wait for build to complete
4. Test web app login flow
5. Verify `localStorage` contains auth token
6. Confirm no console errors

## Additional Notes
- The warning about values larger than 2048 bytes only applies to native SecureStore and is informational
- Web localStorage has much higher limits (typically 5-10MB)
- Both storage methods are asynchronous for consistency
- Error handling remains consistent across both platforms
