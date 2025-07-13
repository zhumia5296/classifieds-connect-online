import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFeaturedAdsCleanup = () => {
  const [cleanupComplete, setCleanupComplete] = useState(false);

  useEffect(() => {
    const cleanupExpiredFeaturedAds = async () => {
      try {
        // Call the database function to handle cleanup
        const { data, error } = await supabase.rpc('expire_featured_ads');

        if (error) {
          console.error('Error cleaning up expired featured ads:', error);
        } else {
          console.log(`Cleanup completed. Expired ${data || 0} featured ads.`);
          setCleanupComplete(true);
        }
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    };

    // Run cleanup on mount
    cleanupExpiredFeaturedAds();

    // Set up interval to run cleanup every 10 minutes (reduced frequency since we have cron job)
    const interval = setInterval(cleanupExpiredFeaturedAds, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Manual cleanup function for immediate use
  const runCleanup = async () => {
    try {
      const { data, error } = await supabase.rpc('expire_featured_ads');
      if (error) throw error;
      console.log(`Manual cleanup completed. Expired ${data || 0} featured ads.`);
      return data || 0;
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      throw error;
    }
  };

  return { cleanupComplete, runCleanup };
};