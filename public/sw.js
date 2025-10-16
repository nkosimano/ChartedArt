// ChartedArt Service Worker
// Provides offline support, background sync, and push notifications

const CACHE_NAME = 'chartedart-v1';
const STATIC_CACHE = 'chartedart-static-v1';
const DYNAMIC_CACHE = 'chartedart-dynamic-v1';
const IMAGE_CACHE = 'chartedart-images-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add your main CSS and JS bundles here when available
  // '/static/css/main.css',
  // '/static/js/main.js',
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/products',
  '/api/user/profile',
  '/api/categories',
];

// Maximum age for different types of cache (in milliseconds)
const CACHE_EXPIRY = {
  STATIC: 7 * 24 * 60 * 60 * 1000,    // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,       // 24 hours  
  IMAGES: 30 * 24 * 60 * 60 * 1000,   // 30 days
  API: 5 * 60 * 1000,                 // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return !cacheName.startsWith('chartedart-') || 
                     cacheName === 'chartedart-v0'; // Remove old versions
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol !== 'https:' && url.protocol !== 'http:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImage(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isAPI(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Default: network first for everything else
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Background Sync - for offline order submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'Your ChartedArt order has been updated!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'order-update',
    requireInteraction: true,
    actions: [
      {
        action: 'view-order',
        title: 'View Order',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: '/orders',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.title = payload.title || 'ChartedArt';
      if (payload.url) options.data.url = payload.url;
    } catch (e) {
      console.log('[SW] Push payload not valid JSON');
    }
  }

  event.waitUntil(
    self.registration.showNotification('ChartedArt', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view-order') {
    const url = event.notification.data?.url || '/orders';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'dismiss') {
    // Just close, no action needed
    return;
  } else {
    // Default click - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// CACHING STRATEGIES

// Cache First - for static assets and images
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
    const expiry = cacheName === IMAGE_CACHE ? CACHE_EXPIRY.IMAGES : CACHE_EXPIRY.STATIC;
    
    if (Date.now() - cacheTime.getTime() < expiry) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Add cache timestamp
      const responseToCache = networkResponse.clone();
      responseToCache.headers.append('sw-cache-time', new Date().toISOString());
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Network First - for HTML pages and dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Stale While Revalidate - for API calls
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh data
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse); // Fallback to cache on network error

  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

// BACKGROUND SYNC FUNCTIONS

async function syncOrders() {
  try {
    // Get pending orders from IndexedDB
    const pendingOrders = await getPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          await removePendingOrder(order.id);
          console.log('[SW] Successfully synced order:', order.id);
        }
      } catch (error) {
        console.log('[SW] Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Error during order sync:', error);
  }
}

async function syncAnalytics() {
  try {
    // Get pending analytics events from IndexedDB
    const pendingEvents = await getPendingAnalytics();
    
    if (pendingEvents.length > 0) {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: pendingEvents })
      });
      
      if (response.ok) {
        await clearPendingAnalytics();
        console.log('[SW] Successfully synced analytics events:', pendingEvents.length);
      }
    }
  } catch (error) {
    console.log('[SW] Error during analytics sync:', error);
  }
}

// HELPER FUNCTIONS

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/static/') || 
         url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname === '/manifest.json';
}

function isImage(request) {
  return request.destination === 'image' ||
         request.url.includes('/images/') ||
         request.url.includes('/icons/') ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isAPI(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') ||
         CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// IndexedDB helpers for offline storage
async function getPendingOrders() {
  // Implement IndexedDB access for pending orders
  // This would be connected to your offline storage system
  return [];
}

async function removePendingOrder(orderId) {
  // Remove successfully synced order from IndexedDB
}

async function getPendingAnalytics() {
  // Get pending analytics events from IndexedDB
  return [];
}

async function clearPendingAnalytics() {
  // Clear successfully synced analytics events
}

console.log('[SW] Service Worker loaded successfully');