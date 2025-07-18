import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSavedAds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedAdIds, setSavedAdIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const lastErrorTime = useRef<number>(0);

  // Fetch saved ads for the current user
  const fetchSavedAds = async () => {
    if (!user) {
      setSavedAdIds([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_ads')
        .select('ad_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedAdIds(data?.map(item => item.ad_id) || []);
    } catch (error) {
      console.error('Error fetching saved ads:', error);
      
      // Throttle error toasts to prevent spam - only show once every 5 seconds
      const now = Date.now();
      if (now - lastErrorTime.current > 5000) {
        toast({
          title: "Error",
          description: "Failed to load saved ads",
          variant: "destructive",
        });
        lastErrorTime.current = now;
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle save status of an ad
  const toggleSaveAd = async (adId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save ads",
        variant: "destructive",
      });
      return;
    }

    const isSaved = savedAdIds.includes(adId);

    try {
      if (isSaved) {
        // Remove from saved ads
        const { error } = await supabase
          .from('saved_ads')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', adId);

        if (error) throw error;

        setSavedAdIds(prev => prev.filter(id => id !== adId));
        toast({
          title: "Ad unsaved",
          description: "Removed from your saved ads",
        });
      } else {
        // Add to saved ads
        const { error } = await supabase
          .from('saved_ads')
          .insert({
            user_id: user.id,
            ad_id: adId,
          });

        if (error) throw error;

        setSavedAdIds(prev => [...prev, adId]);
        toast({
          title: "Ad saved",
          description: "Added to your saved ads",
        });
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast({
        title: "Error",
        description: "Failed to update saved status",
        variant: "destructive",
      });
    }
  };

  // Get saved ads with full ad details
  const getSavedAdsWithDetails = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('saved_ads')
        .select(`
          ad_id,
          created_at,
          ads (
            id,
            title,
            description,
            price,
            currency,
            location,
            latitude,
            longitude,
            condition,
            created_at,
            user_id,
            is_featured,
            featured_until,
            categories (
              name
            ),
            ad_images (
              image_url,
              is_primary
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        ...item.ads,
        savedAt: item.created_at,
        category: item.ads?.categories?.name || 'Uncategorized',
        imageUrl: item.ads?.ad_images?.find(img => img.is_primary)?.image_url || '/placeholder.svg'
      })) || [];
    } catch (error) {
      console.error('Error fetching saved ads with details:', error);
      
      // Throttle error toasts to prevent spam - only show once every 5 seconds
      const now = Date.now();
      if (now - lastErrorTime.current > 5000) {
        toast({
          title: "Error",
          description: "Failed to load saved ads",
          variant: "destructive",
        });
        lastErrorTime.current = now;
      }
      return [];
    }
  };

  // Check if an ad is saved
  const isAdSaved = (adId: string) => savedAdIds.includes(adId);

  useEffect(() => {
    fetchSavedAds();
  }, [user]);

  return {
    savedAdIds,
    loading,
    toggleSaveAd,
    getSavedAdsWithDetails,
    isAdSaved,
    refetch: fetchSavedAds,
  };
};