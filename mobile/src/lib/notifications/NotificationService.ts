import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '@/lib/api/client';
import HapticFeedback from '@/lib/haptics';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'order_update' | 'shipping' | 'delivery' | 'community' | 'live_event' | 'promotion';
  orderId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Project ID not found');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Send token to backend
      await this.sendTokenToBackend(token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('shipping', {
      name: 'Shipping Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('community', {
      name: 'Community',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#95E1D3',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
    });
  }

  /**
   * Send push token to backend
   */
  private async sendTokenToBackend(token: string) {
    try {
      await apiClient.post('/push-token', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: trigger || null,
    });

    return notificationId;
  }

  /**
   * Show immediate notification
   */
  async showNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    await HapticFeedback.light();
    
    return await this.scheduleLocalNotification(title, body, data);
  }

  /**
   * Handle order status notification
   */
  async notifyOrderStatus(
    orderId: string,
    status: string,
    message: string
  ): Promise<void> {
    const statusEmojis: Record<string, string> = {
      confirmed: '✅',
      processing: '🎨',
      shipped: '📦',
      delivered: '🎉',
      cancelled: '❌',
    };

    const emoji = statusEmojis[status.toLowerCase()] || '📋';
    
    await this.showNotification(
      `${emoji} Order ${status}`,
      message,
      {
        type: 'order_update',
        orderId,
        status,
      }
    );
  }

  /**
   * Handle shipping notification
   */
  async notifyShipping(
    orderId: string,
    trackingNumber: string,
    carrier: string
  ): Promise<void> {
    await this.showNotification(
      '📦 Your Art is On the Way!',
      `Track your shipment: ${trackingNumber}`,
      {
        type: 'shipping',
        orderId,
        trackingNumber,
        carrier,
      }
    );
  }

  /**
   * Handle delivery notification
   */
  async notifyDelivery(orderId: string): Promise<void> {
    await this.showNotification(
      '🎉 Your Art Has Arrived!',
      'Your artwork has been delivered. Enjoy!',
      {
        type: 'delivery',
        orderId,
      }
    );
  }

  /**
   * Handle live shopping event notification
   */
  async notifyLiveEvent(
    eventTitle: string,
    startTime: Date
  ): Promise<void> {
    const minutesUntil = Math.floor((startTime.getTime() - Date.now()) / 60000);
    
    await this.showNotification(
      '🎥 Live Shopping Event Starting Soon!',
      `${eventTitle} starts in ${minutesUntil} minutes`,
      {
        type: 'live_event',
        eventTitle,
        startTime: startTime.toISOString(),
      }
    );
  }

  /**
   * Handle community interaction notification
   */
  async notifyCommunityInteraction(
    type: 'like' | 'comment' | 'follow',
    username: string,
    itemTitle?: string
  ): Promise<void> {
    const messages = {
      like: `${username} liked your ${itemTitle}`,
      comment: `${username} commented on your ${itemTitle}`,
      follow: `${username} started following you`,
    };

    await this.showNotification(
      '💬 Community Activity',
      messages[type],
      {
        type: 'community',
        interactionType: type,
        username,
      }
    );
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = NotificationService.getInstance();
