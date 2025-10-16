import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NotificationPermission {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [notificationState, setNotificationState] = useState<NotificationPermission>({
    permission: Notification.permission,
    subscription: null,
  });

  useEffect(() => {
    registerServiceWorker();
    setupPWAInstallPrompt();
    setupOfflineDetection();
    setupNotificationState();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });

        console.log('[PWA] Service Worker registered successfully');
        return registration;
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  };

  const setupPWAInstallPrompt = () => {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault(); // Prevent the default prompt
      setInstallPrompt(e as any);
      setIsInstallable(true);
    });

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      
      // Track installation event
      trackPWAEvent('pwa_installed');
    });

    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
  };

  const setupOfflineDetection = () => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  const setupNotificationState = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setNotificationState({
          permission: Notification.permission,
          subscription,
        });
      } catch (error) {
        console.error('[PWA] Error setting up notification state:', error);
      }
    }
  };

  const installPWA = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for user's choice
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        trackPWAEvent('pwa_install_accepted');
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        trackPWAEvent('pwa_install_dismissed');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error during app installation:', error);
      return false;
    } finally {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setNotificationState(prev => ({
        ...prev,
        permission,
      }));

      if (permission === 'granted') {
        const subscription = await subscribeToPushNotifications();
        trackPWAEvent('notification_permission_granted');
        return !!subscription;
      } else {
        trackPWAEvent('notification_permission_denied');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          console.error('[PWA] VAPID public key not configured');
          return null;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        console.log('[PWA] Successfully subscribed to push notifications');
      }

      // Send subscription to backend
      if (subscription) {
        await saveSubscriptionToBackend(subscription);
        setNotificationState(prev => ({
          ...prev,
          subscription,
        }));
      }

      return subscription;
    } catch (error) {
      console.error('[PWA] Error subscribing to push notifications:', error);
      return null;
    }
  };

  const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
    try {
      if (notificationState.subscription) {
        const success = await notificationState.subscription.unsubscribe();
        
        if (success) {
          await removeSubscriptionFromBackend(notificationState.subscription);
          setNotificationState(prev => ({
            ...prev,
            subscription: null,
          }));
          trackPWAEvent('push_notification_unsubscribed');
        }
        
        return success;
      }
      return true;
    } catch (error) {
      console.error('[PWA] Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (notificationState.permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [200, 100, 200],
          ...options,
        });
      } catch (error) {
        console.error('[PWA] Error showing notification:', error);
      }
    }
  };

  const trackPWAEvent = async (eventName: string, properties?: Record<string, any>) => {
    try {
      // Track PWA-specific events in your analytics
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Create a user session event
        const sessionId = generateSessionId();
        
        await supabase.from('user_browsing_history').insert({
          user_id: session.user.id,
          session_id: sessionId,
          page_url: `pwa-event:${eventName}`,
          device_type: getDeviceType(),
          time_spent_seconds: 0,
        });
      }

      console.log(`[PWA] Event tracked: ${eventName}`, properties);
    } catch (error) {
      console.error('[PWA] Error tracking event:', error);
    }
  };

  return {
    // Installation
    isInstallable,
    isInstalled,
    installPWA,
    
    // Offline detection
    isOffline,
    
    // Notifications
    notificationPermission: notificationState.permission,
    isNotificationSubscribed: !!notificationState.subscription,
    requestNotificationPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    showNotification,
    
    // Utilities
    trackPWAEvent,
  };
}

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscriptionToBackend(subscription: PushSubscription) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Save push subscription to user profile or separate table
    await supabase
      .from('profiles')
      .update({
        preferences: {
          push_subscription: subscription.toJSON(),
          push_enabled: true,
        }
      })
      .eq('id', session.user.id);

    console.log('[PWA] Subscription saved to backend');
  } catch (error) {
    console.error('[PWA] Error saving subscription:', error);
  }
}

async function removeSubscriptionFromBackend(subscription: PushSubscription) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Remove push subscription from user profile
    await supabase
      .from('profiles')
      .update({
        preferences: {
          push_subscription: null,
          push_enabled: false,
        }
      })
      .eq('id', session.user.id);

    console.log('[PWA] Subscription removed from backend');
  } catch (error) {
    console.error('[PWA] Error removing subscription:', error);
  }
}

function generateSessionId(): string {
  return `pwa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}