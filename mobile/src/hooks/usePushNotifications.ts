import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiClient from '../lib/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // iOS specific behaviors
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

export function usePushNotifications(enabled: boolean) {
  const [token, setToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        let status = settings.status as string;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status as string;
        }
        setPermissionStatus(status);
        if (status !== 'granted') return;

        const projectId = Notifications.getExpoPushTokenAsync.length
          ? undefined
          : undefined;
        const expoToken = await Notifications.getExpoPushTokenAsync({ projectId: undefined as any });
        const tokenStr = expoToken.data;
        setToken(tokenStr);

        await apiClient.post('/push-token', {
          token: tokenStr,
          platform: Platform.OS,
        });
      } catch (e) {
        // Silently ignore
      }
    })();
  }, [enabled]);

  return { token, permissionStatus };
}
