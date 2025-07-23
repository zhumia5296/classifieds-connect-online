import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrendingItem {
  item_type: 'ad' | 'search' | 'category';
  item_id?: string;
  search_term?: string;
  category_id?: string;
  trend_score: number;
  view_count: number;
  search_count: number;
  last_activity_at: string;
}

export const useTrendingItems = (locationArea?: string) => {
  const [trendingAds, setTrendingAds] = useState<TrendingItem[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingItem[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's approximate location area
  const getUserLocationArea = async (): Promise<string> => {
    if (locationArea) return locationArea;
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 300000 // 5 minutes
        });
      });

      // Use reverse geocoding to get city/area (simplified)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
      );
      const data = await response.json();
      
      return data.address?.city || data.address?.town || data.address?.state || 'Unknown';
    } catch (error) {
      console.warn('Could not get location for trending items:', error);
      return 'Unknown';
    }
  };

  // Fetch trending items for location
  const fetchTrendingItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const area = await getUserLocationArea();
      
      // Fetch trending ads
      const { data: ads, error: adsError } = await supabase
        .rpc('get_trending_items', {
          p_location_area: area,
          p_item_type: 'ad',
          p_limit: 5
        });

      if (adsError) throw adsError;

      // Fetch trending searches
      const { data: searches, error: searchesError } = await supabase
        .rpc('get_trending_items', {
          p_location_area: area,
          p_item_type: 'search',
          p_limit: 8
        });

      if (searchesError) throw searchesError;

      // Fetch trending categories
      const { data: categories, error: categoriesError } = await supabase
        .rpc('get_trending_items', {
          p_location_area: area,
          p_item_type: 'category',
          p_limit: 6
        });

      if (categoriesError) throw categoriesError;

      setTrendingAds((ads || []) as TrendingItem[]);
      setTrendingSearches((searches || []) as TrendingItem[]);
      setTrendingCategories((categories || []) as TrendingItem[]);
    } catch (err) {
      console.error('Error fetching trending items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trending items');
    } finally {
      setLoading(false);
    }
  };

  // Track user activity for trending
  const trackActivity = async (
    itemType: 'ad' | 'search' | 'category',
    activityType: 'view' | 'search' = 'view',
    itemId?: string,
    searchTerm?: string,
    categoryId?: string
  ) => {
    try {
      const area = await getUserLocationArea();
      
      await supabase.rpc('track_trending_activity', {
        p_item_type: itemType,
        p_item_id: itemId || null,
        p_search_term: searchTerm || null,
        p_category_id: categoryId || null,
        p_location_area: area,
        p_activity_type: activityType
      });
    } catch (error) {
      console.error('Error tracking trending activity:', error);
      // Don't show error to user for tracking failures
    }
  };

  useEffect(() => {
    fetchTrendingItems();
  }, [locationArea]);

  return {
    trendingAds,
    trendingSearches,
    trendingCategories,
    loading,
    error,
    trackActivity,
    refetch: fetchTrendingItems
  };
};