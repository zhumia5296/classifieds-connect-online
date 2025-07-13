import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFeaturedAdsCleanup = () => {
  const [cleanupComplete, setCleanupComplete] = useState(false);

  useEffect(() => {
    const cleanupExpiredFeaturedAds = async () => {
      try {
        // Update ads where featured_until has passed
        const { error } = await supabase
          .from('ads')
          .update({ 
            is_featured: false,
            featured_until: null 
          })
          .lt('featured_until', new Date().toISOString())
          .eq('is_featured', true);

        if (error) {
          console.error('Error cleaning up expired featured ads:', error);
        } else {
          console.log('Cleanup of expired featured ads completed');
          setCleanupComplete(true);
        }
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    };

    // Run cleanup on mount
    cleanupExpiredFeaturedAds();

    // Set up interval to run cleanup every 5 minutes
    const interval = setInterval(cleanupExpiredFeaturedAds, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { cleanupComplete };
};