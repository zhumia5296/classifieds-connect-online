// Service Worker for Push Notifications and PWA
const CACHE_NAME = 'classifieds-connect-v1';
const BASE_URL = 'https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/auth',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Error during service worker installation:', error);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Classifieds Connect',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions || [],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    renotify: notificationData.renotify || false,
    image: notificationData.image,
    vibrate: notificationData.vibrate || [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Handle notification actions
  if (action === 'reply') {
    // Open messages page for reply action
    event.waitUntil(
      clients.openWindow(`${BASE_URL}/messages`)
    );
    return;
  }

  if (action === 'view') {
    // Open the specific URL or default page
    event.waitUntil(
      clients.openWindow(data.url ? `${BASE_URL}${data.url}` : BASE_URL)
    );
    return;
  }

  if (action === 'renew') {
    // Open dashboard for renew action
    event.waitUntil(
      clients.openWindow(`${BASE_URL}/dashboard`)
    );
    return;
  }

  // Default click behavior - open the app
  const urlToOpen = data.url ? `${BASE_URL}${data.url}` : BASE_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.startsWith(BASE_URL) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-message-sync') {
    event.waitUntil(
      // Sync messages when back online
      syncMessages()
    );
  }
});

// Background message sync function
async function syncMessages() {
  try {
    // This would sync any pending messages when back online
    console.log('Syncing messages in background...');
    // Implementation would depend on your offline message queue
  } catch (error) {
    console.error('Error syncing messages:', error);
  }
}

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  
  // Track notification dismissal if needed
  // You could send analytics data here
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});