// Notification display functions

import type { NotificationPayload } from './types';

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