import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

interface AnalyticsEvent {
  event_name: string;
  page_url: string;
  timestamp: number;
  session_id: string;
  user_id?: string;
  device_info: DeviceInfo;
  page_data?: Record<string, any>;
  custom_properties?: Record<string, any>;
}

interface DeviceInfo {
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  operating_system: string;
  screen_resolution: string;
  viewport_size: string;
  is_pwa: boolean;
  is_online: boolean;
  user_agent: string;
}

interface PageView {
  page_url: string;
  title: string;
  referrer: string;
  timestamp: number;
  time_spent: number;
  scroll_depth: number;
  utm_parameters: UTMParameters;
}

interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export function useAnalytics() {
  const location = useLocation();
  const [sessionId] = useState(() => generateSessionId());
  const [isTracking, setIsTracking] = useState(true);
  const [deviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());
  
  // Page tracking state
  const pageStartTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const scrollDepthTimeout = useRef<NodeJS.Timeout>();
  const pageViewBatch = useRef<PageView[]>([]);
  const eventBatch = useRef<AnalyticsEvent[]>([]);

  // Initialize session tracking
  useEffect(() => {
    initializeSession();
    setupScrollTracking();
    setupUnloadTracking();
    
    return () => {
      flushAnalytics();
    };
  }, []);

  // Track page views
  useEffect(() => {
    trackPageView();
    pageStartTime.current = Date.now();
    maxScrollDepth.current = 0;
  }, [location]);

  const initializeSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create session record
      await supabase.from('user_sessions').insert({
        session_id: sessionId,
        user_id: session?.user.id,
        started_at: new Date().toISOString(),
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        operating_system: deviceInfo.operating_system,
        ip_address: await getClientIP(),
        entry_page: window.location.pathname,
        referrer: document.referrer || null,
        ...getUTMParameters(),
      });

      console.log('[Analytics] Session initialized:', sessionId);
    } catch (error) {
      console.error('[Analytics] Session initialization failed:', error);
    }
  };

  const trackPageView = () => {
    const pageView: PageView = {
      page_url: location.pathname,
      title: document.title,
      referrer: document.referrer || '',
      timestamp: Date.now(),
      time_spent: 0,
      scroll_depth: 0,
      utm_parameters: getUTMParameters(),
    };

    // Track immediately for navigation events
    trackEvent('page_view', {
      page: location.pathname,
      title: document.title,
    });

    // Store for batching
    pageViewBatch.current.push(pageView);
    
    console.log('[Analytics] Page view tracked:', location.pathname);
  };

  const trackEvent = useCallback(async (
    eventName: string,
    properties: Record<string, any> = {},
    immediate: boolean = false
  ) => {
    if (!isTracking) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const event: AnalyticsEvent = {
        event_name: eventName,
        page_url: location.pathname,
        timestamp: Date.now(),
        session_id: sessionId,
        user_id: session?.user.id,
        device_info: deviceInfo,
        custom_properties: properties,
      };

      if (immediate) {
        // Send immediately for critical events
        await sendEventToDatabase(event);
      } else {
        // Batch for performance
        eventBatch.current.push(event);
        
        // Auto-flush after 10 events or 30 seconds
        if (eventBatch.current.length >= 10) {
          flushEventBatch();
        }
      }

      console.log(`[Analytics] Event tracked: ${eventName}`, properties);
    } catch (error) {
      console.error('[Analytics] Event tracking failed:', error);
    }
  }, [location.pathname, sessionId, deviceInfo, isTracking]);

  const trackPurchase = useCallback((orderData: {
    order_id: string;
    amount: number;
    currency: string;
    payment_method: string;
    items: any[];
  }) => {
    trackEvent('purchase', {
      order_id: orderData.order_id,
      value: orderData.amount,
      currency: orderData.currency,
      payment_method: orderData.payment_method,
      num_items: orderData.items.length,
      item_categories: orderData.items.map(item => item.category).join(','),
    }, true); // Send immediately
  }, [trackEvent]);

  const trackProductView = useCallback((productData: {
    product_id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
  }) => {
    trackEvent('product_view', {
      product_id: productData.product_id,
      product_name: productData.name,
      category: productData.category,
      value: productData.price,
      currency: productData.currency,
    });

    // Also track in browsing history for personalization
    trackBrowsingHistory(productData.product_id);
  }, [trackEvent]);

  const trackAddToCart = useCallback((productData: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    trackEvent('add_to_cart', {
      product_id: productData.product_id,
      product_name: productData.name,
      value: productData.price * productData.quantity,
      quantity: productData.quantity,
    });
  }, [trackEvent]);

  const trackCheckoutStart = useCallback((cartData: {
    cart_total: number;
    currency: string;
    item_count: number;
    items: any[];
  }) => {
    trackEvent('checkout_start', {
      value: cartData.cart_total,
      currency: cartData.currency,
      num_items: cartData.item_count,
      checkout_step: 1,
    });
  }, [trackEvent]);

  const trackSearchQuery = useCallback((query: string, results?: number) => {
    trackEvent('search', {
      search_term: query,
      num_results: results,
    });
  }, [trackEvent]);

  const trackUserEngagement = useCallback((engagementData: {
    action: string;
    element?: string;
    value?: string;
  }) => {
    trackEvent('user_engagement', {
      engagement_type: engagementData.action,
      element_id: engagementData.element,
      engagement_value: engagementData.value,
    });
  }, [trackEvent]);

  const trackBrowsingHistory = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('user_browsing_history').insert({
        user_id: session.user.id,
        product_id: productId,
        session_id: sessionId,
        page_url: location.pathname,
        time_spent_seconds: Math.floor((Date.now() - pageStartTime.current) / 1000),
        scroll_depth: maxScrollDepth.current,
        device_type: deviceInfo.device_type,
      });
    } catch (error) {
      console.error('[Analytics] Browsing history tracking failed:', error);
    }
  };

  const setupScrollTracking = () => {
    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = documentHeight > 0 ? Math.min(scrollTop / documentHeight, 1) : 0;
      
      maxScrollDepth.current = Math.max(maxScrollDepth.current, scrollDepth);

      // Throttle scroll depth tracking
      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }
      
      scrollDepthTimeout.current = setTimeout(() => {
        // Track milestone scroll depths
        const percentage = Math.floor(scrollDepth * 100);
        if (percentage > 0 && percentage % 25 === 0) {
          trackEvent('scroll_depth', { 
            scroll_percentage: percentage,
            page: location.pathname,
          });
        }
      }, 1000);
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', updateScrollDepth);
      if (scrollDepthTimeout.current) {
        clearTimeout(scrollDepthTimeout.current);
      }
    };
  };

  const setupUnloadTracking = () => {
    const handleUnload = () => {
      // Track time spent on page
      const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
      
      if (timeSpent > 5) { // Only track if user spent more than 5 seconds
        trackEvent('page_exit', {
          time_spent: timeSpent,
          scroll_depth: maxScrollDepth.current,
          page: location.pathname,
        }, true);
      }

      flushAnalytics();
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  };

  const flushEventBatch = async () => {
    if (eventBatch.current.length === 0) return;

    try {
      const events = [...eventBatch.current];
      eventBatch.current = [];

      // Send events in batch
      for (const event of events) {
        await sendEventToDatabase(event);
      }

      console.log(`[Analytics] Flushed ${events.length} events`);
    } catch (error) {
      console.error('[Analytics] Event batch flush failed:', error);
    }
  };

  const flushAnalytics = () => {
    // Flush any remaining events
    flushEventBatch();
    
    // Update session end time
    updateSessionEndTime();
  };

  const sendEventToDatabase = async (event: AnalyticsEvent) => {
    try {
      // Store in browsing history if it's a page view or product view
      if (event.event_name === 'page_view' || event.event_name === 'product_view') {
        await supabase.from('user_browsing_history').insert({
          user_id: event.user_id,
          product_id: event.custom_properties?.product_id,
          session_id: event.session_id,
          page_url: event.page_url,
          time_spent_seconds: event.custom_properties?.time_spent || 0,
          scroll_depth: event.custom_properties?.scroll_depth || 0,
          device_type: event.device_info.device_type,
        });
      }

      // Update session with page views count
      await supabase.from('user_sessions').update({
        page_views: supabase.sql`page_views + 1`,
        events: supabase.sql`
          COALESCE(events, '[]'::jsonb) || 
          ${JSON.stringify({
            event: event.event_name,
            timestamp: event.timestamp,
            properties: event.custom_properties
          })}::jsonb
        `,
        ended_at: new Date().toISOString(),
      }).eq('session_id', event.session_id);

    } catch (error) {
      console.error('[Analytics] Database storage failed:', error);
      
      // Store locally for offline sync
      if ('serviceWorker' in navigator) {
        storeOfflineEvent(event);
      }
    }
  };

  const updateSessionEndTime = async () => {
    try {
      await supabase.from('user_sessions').update({
        ended_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - pageStartTime.current) / 1000),
      }).eq('session_id', sessionId);
    } catch (error) {
      console.error('[Analytics] Session end time update failed:', error);
    }
  };

  const storeOfflineEvent = (event: AnalyticsEvent) => {
    // Store in localStorage for service worker to sync later
    try {
      const offlineEvents = JSON.parse(localStorage.getItem('offline_analytics') || '[]');
      offlineEvents.push(event);
      
      // Keep only last 100 events to prevent storage bloat
      const recentEvents = offlineEvents.slice(-100);
      localStorage.setItem('offline_analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('[Analytics] Offline storage failed:', error);
    }
  };

  return {
    // Core tracking
    trackEvent,
    trackPageView,
    
    // E-commerce tracking
    trackProductView,
    trackAddToCart,
    trackCheckoutStart,
    trackPurchase,
    
    // User behavior tracking
    trackSearchQuery,
    trackUserEngagement,
    
    // Utilities
    sessionId,
    deviceInfo,
    isTracking,
    setIsTracking,
    flushAnalytics,
  };
}

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  return {
    device_type: getDeviceType(),
    browser: getBrowser(userAgent),
    operating_system: getOperatingSystem(userAgent),
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    is_pwa: window.matchMedia('(display-mode: standalone)').matches,
    is_online: navigator.onLine,
    user_agent: userAgent,
  };
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getUTMParameters(): UTMParameters {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
  };
}

async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
}