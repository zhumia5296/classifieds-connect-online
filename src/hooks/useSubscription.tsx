import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastErrorTime = useRef<number>(0);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Subscription check error:', error);
        setError(error.message);
        
        // Throttle error toasts to prevent spam - only show once every 10 seconds
        const now = Date.now();
        if (now - lastErrorTime.current > 10000) {
          toast.error('Failed to check subscription status');
          lastErrorTime.current = now;
        }
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Subscription check failed:', err);
      setError('Failed to check subscription');
      toast.error('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCheckout = async (tier: 'basic' | 'premium' | 'enterprise') => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });

      if (error) {
        console.error('Checkout creation error:', error);
        toast.error('Failed to create checkout session');
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast.error('Please log in to manage subscription');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Customer portal error:', error);
        toast.error('Failed to open customer portal');
        return;
      }

      if (data?.url) {
        // Open customer portal in a new tab
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Customer portal failed:', err);
      toast.error('Failed to open customer portal');
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = (requiredTier: 'basic' | 'premium' | 'enterprise') => {
    if (!subscription.subscribed) return false;
    
    const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    const currentTierLevel = tierHierarchy[subscription.subscription_tier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier];
    
    return currentTierLevel >= requiredTierLevel;
  };

  // Auto-check subscription on user change
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 30 seconds when on subscription-related pages
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.location.pathname.includes('pricing') || 
          window.location.pathname.includes('subscription') ||
          window.location.pathname.includes('settings')) {
        checkSubscription();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    hasFeatureAccess,
    isBasic: subscription.subscription_tier === 'basic',
    isPremium: subscription.subscription_tier === 'premium', 
    isEnterprise: subscription.subscription_tier === 'enterprise',
  };
};