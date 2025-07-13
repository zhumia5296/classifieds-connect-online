// Push notification type definitions

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