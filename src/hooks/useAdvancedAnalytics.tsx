import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalyticsEvent {
  event_name: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: Date;
  page_url: string;
  user_agent: string;
  ip_address?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface PageView {
  page_url: string;
  title: string;
  user_id?: string;
  session_id: string;
  timestamp: Date;
  duration?: number;
  referrer?: string;
  exit_page?: boolean;
}

export interface UserAction {
  action_type: 'click' | 'scroll' | 'form_submit' | 'search' | 'filter' | 'share' | 'download';
  element_id?: string;
  element_class?: string;
  element_text?: string;
  coordinates?: { x: number; y: number };
  value?: string;
  timestamp: Date;
}

export const useAdvancedAnalytics = () => {
  const { user } = useAuth();
  const [sessionId] = useState(() => generateSessionId());
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [isTracking, setIsTracking] = useState(true);

  // Generate unique session ID
  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract UTM parameters from URL
  const getUTMParameters = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
    };
  }, []);

  // Track custom events
  const trackEvent = useCallback(async (
    eventName: string,
    eventData?: Record<string, any>
  ) => {
    if (!isTracking) return;

    const utmParams = getUTMParameters();
    
    const event: AnalyticsEvent = {
      event_name: eventName,
      event_data: eventData,
      user_id: user?.id,
      session_id: sessionId,
      timestamp: new Date(),
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      referrer: document.referrer || undefined,
      ...utmParams
    };

    try {
      const { error } = await supabase
        .from('analytics_events' as any)
        .insert([event]);

      if (error) {
        console.error('Failed to track event:', error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [user?.id, sessionId, isTracking, getUTMParameters]);

  // Track page views
  const trackPageView = useCallback(async (
    pageUrl: string = window.location.href,
    title: string = document.title
  ) => {
    if (!isTracking) return;

    const pageView: PageView = {
      page_url: pageUrl,
      title,
      user_id: user?.id,
      session_id: sessionId,
      timestamp: new Date(),
      referrer: document.referrer || undefined,
    };

    try {
      const { error } = await supabase
        .from('analytics_page_views' as any)
        .insert([pageView]);

      if (error) {
        console.error('Failed to track page view:', error);
      }
    } catch (error) {
      console.error('Page view tracking error:', error);
    }

    setPageStartTime(Date.now());
  }, [user?.id, sessionId, isTracking]);

  // Track user actions
  const trackUserAction = useCallback(async (action: UserAction) => {
    if (!isTracking) return;

    const actionData = {
      ...action,
      user_id: user?.id,
      session_id: sessionId,
      page_url: window.location.href,
    };

    try {
      const { error } = await supabase
        .from('analytics_user_actions' as any)
        .insert([actionData]);

      if (error) {
        console.error('Failed to track user action:', error);
      }
    } catch (error) {
      console.error('User action tracking error:', error);
    }
  }, [user?.id, sessionId, isTracking]);

  // Track ad interactions
  const trackAdInteraction = useCallback(async (
    adId: string,
    interactionType: 'view' | 'click' | 'contact' | 'save' | 'share',
    additionalData?: Record<string, any>
  ) => {
    await trackEvent('ad_interaction', {
      ad_id: adId,
      interaction_type: interactionType,
      ...additionalData
    });
  }, [trackEvent]);

  // Track conversion events
  const trackConversion = useCallback(async (
    conversionType: 'ad_posted' | 'contact_made' | 'ad_featured' | 'user_signup',
    value?: number,
    currency?: string
  ) => {
    await trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency
    });
  }, [trackEvent]);

  // Track search behavior
  const trackSearch = useCallback(async (
    query: string,
    category?: string,
    location?: string,
    resultsCount?: number
  ) => {
    await trackEvent('search', {
      query,
      category,
      location,
      results_count: resultsCount
    });
  }, [trackEvent]);

  // Track form interactions
  const trackFormInteraction = useCallback(async (
    formName: string,
    fieldName: string,
    action: 'focus' | 'blur' | 'change' | 'submit' | 'error',
    value?: string
  ) => {
    await trackEvent('form_interaction', {
      form_name: formName,
      field_name: fieldName,
      action,
      value: action === 'change' ? undefined : value // Don't track actual input values for privacy
    });
  }, [trackEvent]);

  // Track performance metrics
  const trackPerformance = useCallback(async (metrics: {
    page_load_time?: number;
    time_to_interactive?: number;
    largest_contentful_paint?: number;
    first_input_delay?: number;
    cumulative_layout_shift?: number;
  }) => {
    await trackEvent('performance', metrics);
  }, [trackEvent]);

  // Track errors
  const trackError = useCallback(async (
    errorType: string,
    errorMessage: string,
    stackTrace?: string,
    componentName?: string
  ) => {
    await trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      stack_trace: stackTrace,
      component_name: componentName
    });
  }, [trackEvent]);

  // Track engagement metrics
  const trackEngagement = useCallback(async (
    engagementType: 'scroll_depth' | 'time_on_page' | 'button_click' | 'link_click',
    value: number | string,
    metadata?: Record<string, any>
  ) => {
    await trackEvent('engagement', {
      engagement_type: engagementType,
      value,
      ...metadata
    });
  }, [trackEvent]);

  // Auto-track page exit with duration
  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Date.now() - pageStartTime;
      
      // Use sendBeacon for reliable tracking on page exit
      if (navigator.sendBeacon && isTracking) {
        const exitData = {
          event_name: 'page_exit',
          event_data: { duration },
          user_id: user?.id,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          page_url: window.location.href
        };

        navigator.sendBeacon(
          `${window.location.origin}/api/analytics/track`,
          JSON.stringify(exitData)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pageStartTime, user?.id, sessionId, isTracking]);

  // Auto-track scroll depth
  useEffect(() => {
    if (!isTracking) return;

    let maxScrollDepth = 0;
    const throttledScrollTracker = throttle(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track milestone scroll depths
        if (scrollPercent >= 25 && maxScrollDepth < 25) {
          trackEngagement('scroll_depth', 25);
        } else if (scrollPercent >= 50 && maxScrollDepth < 50) {
          trackEngagement('scroll_depth', 50);
        } else if (scrollPercent >= 75 && maxScrollDepth < 75) {
          trackEngagement('scroll_depth', 75);
        } else if (scrollPercent >= 90 && maxScrollDepth < 90) {
          trackEngagement('scroll_depth', 90);
        }
      }
    }, 1000);

    window.addEventListener('scroll', throttledScrollTracker);
    return () => window.removeEventListener('scroll', throttledScrollTracker);
  }, [isTracking, trackEngagement]);

  return {
    // Core tracking
    trackEvent,
    trackPageView,
    trackUserAction,
    
    // Specific tracking methods
    trackAdInteraction,
    trackConversion,
    trackSearch,
    trackFormInteraction,
    trackPerformance,
    trackError,
    trackEngagement,
    
    // Session info
    sessionId,
    
    // Controls
    setIsTracking,
    isTracking
  };
};

// Utility function for throttling
function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}