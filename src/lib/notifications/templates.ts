// Notification templates

import type { NotificationPayload } from './types';

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