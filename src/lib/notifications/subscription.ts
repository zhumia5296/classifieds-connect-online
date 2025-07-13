// Push subscription management

import { urlBase64ToUint8Array } from './utils';
import type { PushSubscriptionData } from './types';

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