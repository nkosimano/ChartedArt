import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAnalytics } from './useAnalytics';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

type NotificationType = 
  | 'order_confirmed'
  | 'order_shipped' 
  | 'order_delivered'
  | 'payment_successful'
  | 'payment_failed'
  | 'new_follower'
  | 'new_comment'
  | 'comment_reply'
  | 'product_liked'
  | 'new_artwork'
  | 'price_drop'
  | 'auction_ending'
  | 'commission_request'
  | 'exhibition_reminder'
  | 'system_announcement'
  | 'security_alert';

interface NotificationPreferences {
  push_notifications: boolean;
  email_notifications: boolean;
  order_updates: boolean;
  social_interactions: boolean;
  new_artworks: boolean;
  price_alerts: boolean;
  marketing: boolean;
  security_alerts: boolean;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const realtimeChannel = useRef<any>();
  const { trackUserEngagement } = useAnalytics();

  useEffect(() => {
    checkPushSupport();
    loadNotifications();
    loadPreferences();
    setupRealtimeSubscription();

    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, []);

  // Check if push notifications are supported
  const checkPushSupport = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushSupported(false);
        return;
      }

      setPushSupported(true);

      // Check if user is already subscribed
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setPushSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking push support:', error);
      setPushSupported(false);
    }
  }, []);

  // Setup realtime subscription for new notifications
  const setupRealtimeSubscription = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    realtimeChannel.current = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if enabled
          showBrowserNotification(newNotification);

          // Track notification received
          trackUserEngagement({
            action: 'notification_received',
            element: 'notification_system',
            value: newNotification.type,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Update unread count if notification was marked as read
          if (updatedNotification.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();
  }, [trackUserEngagement]);

  // Load notifications from database
  const loadNotifications = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const notifications = data || [];
      setNotifications(prev => offset === 0 ? notifications : [...prev, ...notifications]);

      // Count unread notifications
      const unreadCount = notifications.filter(n => !n.is_read).length;
      setUnreadCount(unreadCount);

    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user notification preferences
  const loadPreferences = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Set default preferences if none exist
      const defaultPreferences: NotificationPreferences = {
        push_notifications: true,
        email_notifications: true,
        order_updates: true,
        social_interactions: true,
        new_artworks: true,
        price_alerts: true,
        marketing: false,
        security_alerts: true,
      };

      setPreferences(data || defaultPreferences);

    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const updatedPreferences = { ...preferences, ...newPreferences };

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: session.user.id,
          ...updatedPreferences,
        });

      if (error) throw error;

      setPreferences(updatedPreferences);

      trackUserEngagement({
        action: 'notification_preferences_updated',
        element: 'settings_form',
        value: 'preferences_changed',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setError(error.message);
      return false;
    }
  }, [preferences, trackUserEngagement]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    try {
      if (!pushSupported) {
        throw new Error('Push notifications not supported');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Save subscription to database
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.toJSON().keys?.p256dh,
          auth: subscription.toJSON().keys?.auth,
        });

      if (error) throw error;

      setPushSubscribed(true);

      trackUserEngagement({
        action: 'push_notification_subscribed',
        element: 'push_subscribe_button',
        value: 'subscribed',
      });

      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      setError(error.message);
      return false;
    }
  }, [pushSupported, trackUserEngagement]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from database
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', session.user.id);
      }

      setPushSubscribed(false);

      trackUserEngagement({
        action: 'push_notification_unsubscribed',
        element: 'push_unsubscribe_button',
        value: 'unsubscribed',
      });

      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from push:', error);
      setError(error.message);
      return false;
    }
  }, [trackUserEngagement]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      trackUserEngagement({
        action: 'notification_read',
        element: 'notification_item',
        value: notificationId,
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [trackUserEngagement]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      setUnreadCount(0);

      trackUserEngagement({
        action: 'notifications_mark_all_read',
        element: 'mark_all_read_button',
        value: 'all_read',
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [trackUserEngagement]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      trackUserEngagement({
        action: 'notification_deleted',
        element: 'delete_button',
        value: notificationId,
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications, trackUserEngagement]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!preferences?.push_notifications) return;

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: notification.id,
        data: notification.data,
        actions: [
          {
            action: 'view',
            title: 'View',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
      });

      browserNotification.onclick = () => {
        markAsRead(notification.id);
        browserNotification.close();
        
        // Handle notification click based on type
        handleNotificationClick(notification);
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  }, [preferences?.push_notifications, markAsRead]);

  // Handle notification click actions
  const handleNotificationClick = useCallback((notification: Notification) => {
    trackUserEngagement({
      action: 'notification_clicked',
      element: 'browser_notification',
      value: notification.type,
    });

    // Route to appropriate page based on notification type
    switch (notification.type) {
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
        if (notification.data?.order_id) {
          window.location.href = `/orders/${notification.data.order_id}`;
        }
        break;
      case 'new_comment':
        if (notification.data?.product_id) {
          window.location.href = `/products/${notification.data.product_id}#comments`;
        }
        break;
      case 'new_follower':
        if (notification.data?.follower_id) {
          window.location.href = `/profile/${notification.data.follower_id}`;
        }
        break;
      case 'new_artwork':
        if (notification.data?.product_id) {
          window.location.href = `/products/${notification.data.product_id}`;
        }
        break;
      case 'price_drop':
        if (notification.data?.product_id) {
          window.location.href = `/products/${notification.data.product_id}`;
        }
        break;
      default:
        // Default to notifications page
        window.location.href = '/notifications';
    }
  }, [trackUserEngagement]);

  // Send notification (for testing/admin)
  const sendNotification = useCallback(async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    pushSupported,
    pushSubscribed,

    // Actions
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Preferences
    updatePreferences,
    
    // Push notifications
    subscribeToPush,
    unsubscribeFromPush,
    
    // Utilities
    sendNotification,
    getNotificationsByType,
    getUnreadNotifications,
    handleNotificationClick,
  };
}