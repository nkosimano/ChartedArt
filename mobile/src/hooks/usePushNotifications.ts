/**
 * STUBBED VERSION - Push Notifications Disabled
 *
 * This is a stub implementation because expo-notifications was removed.
 * Reason: Requires Apple Developer account ($99/year) for APNs keys.
 *
 * To re-enable:
 * 1. Get Apple Developer account
 * 2. npm install expo-notifications@~0.28.9
 * 3. Restore original implementation from git history
 * 4. Configure APNs keys in Apple Developer Portal
 *
 * Alternative: Use in-app notification center with database polling
 */

import { useEffect } from 'react';

export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      console.log('📱 Push notifications are disabled (requires Apple Developer account)');
      console.log('💡 Consider using in-app notification center instead');
    }
  }, [enabled]);

  return {
    token: null,
    permissionStatus: 'unavailable',
    error: 'Push notifications require Apple Developer account and custom build'
  };
}
