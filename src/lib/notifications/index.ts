// Main notifications module - exports all notification functionality

// Types
export type {
  PushSubscriptionData,
  NotificationPayload,
  NotificationPreferences
} from './types';

// Utilities
export {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission
} from './utils';

// Service Worker
export { registerServiceWorker } from './serviceWorker';

// Subscription Management
export {
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  serializePushSubscription
} from './subscription';

// Display
export { showLocalNotification } from './display';

// Templates
export { createNotificationTemplates } from './templates';