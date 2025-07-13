// Push notification utilities - Enhanced for mobile optimization

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationPreferences {
  new_messages: boolean;
  ad_responses: boolean;
  featured_ad_updates: boolean;
  price_changes: boolean;
  ad_expiring: boolean;
  marketing: boolean;
}

// Check if push notifications are supported
export const isPushSupported = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

// Check current permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notifications are blocked. Please enable them in your browser settings.');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

// Get push subscription
export const getPushSubscription = async (registration: ServiceWorkerRegistration): Promise<PushSubscription | null> => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async (registration: ServiceWorkerRegistration): Promise<PushSubscription> => {
  // VAPID public key - this should be generated for your app
  const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKFlF2LLKu0LNPZq6DUIxBFVDAU8rM_y3Q7uJ6e9JQ6e68';
  
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Push subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error creating push subscription:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (subscription: PushSubscription): Promise<boolean> => {
  try {
    const result = await subscription.unsubscribe();
    console.log('Push subscription cancelled:', result);
    return result;
  } catch (error) {
    console.error('Error cancelling push subscription:', error);
    return false;
  }
};

// Convert VAPID public key
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
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
};

// Show local notification (fallback)
export const showLocalNotification = (payload: NotificationPayload): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(payload.title, {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    data: payload.data,
    tag: payload.tag,
    requireInteraction: payload.requireInteraction,
    silent: payload.silent
  });

  // Handle notification click
  notification.onclick = (event) => {
    event.preventDefault();
    
    if (payload.data?.url) {
      window.open(payload.data.url, '_blank');
    }
    
    notification.close();
  };

  // Auto close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);
};

// Convert push subscription to storable format
export const serializePushSubscription = (subscription: PushSubscription): PushSubscriptionData => {
  const keys = subscription.getKey ? {
    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
  } : { p256dh: '', auth: '' };

  return {
    endpoint: subscription.endpoint,
    keys
  };
};

// Create notification templates
export const createNotificationTemplates = {
  newMessage: (senderName: string, adTitle: string): NotificationPayload => ({
    title: `New message from ${senderName}`,
    body: `About: ${adTitle}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'new-message',
    data: {
      type: 'message',
      url: '/messages'
    },
    actions: [
      { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
      { action: 'view', title: 'View Ad', icon: '/icons/view.png' }
    ],
    requireInteraction: true
  }),

  adResponse: (adTitle: string): NotificationPayload => ({
    title: 'Someone is interested in your ad!',
    body: `New inquiry about: ${adTitle}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'ad-response',
    data: {
      type: 'ad-response',
      url: '/messages'
    },
    requireInteraction: true
  }),

  featuredAdConfirmed: (adTitle: string): NotificationPayload => ({
    title: 'Your ad is now featured!',
    body: `${adTitle} is now prominently displayed`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'featured-confirmed',
    data: {
      type: 'featured-confirmed',
      url: '/dashboard'
    }
  }),

  adExpiringSoon: (adTitle: string, daysLeft: number): NotificationPayload => ({
    title: 'Ad expiring soon',
    body: `${adTitle} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'ad-expiring',
    data: {
      type: 'ad-expiring',
      url: '/dashboard'
    },
    actions: [
      { action: 'renew', title: 'Renew Ad', icon: '/icons/renew.png' },
      { action: 'view', title: 'View Ad', icon: '/icons/view.png' }
    ]
  }),

  priceChange: (adTitle: string, newPrice: string): NotificationPayload => ({
    title: 'Price updated',
    body: `${adTitle} is now ${newPrice}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'price-change',
    data: {
      type: 'price-change',
      url: '/dashboard'
    }
  })
};