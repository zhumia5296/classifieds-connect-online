import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface ComparisonAd {
  id: string;
  title: string;
  price: string;
  location: string;
  imageUrl: string;
  category: string;
  condition?: string;
  latitude?: number;
  longitude?: number;
  timeAgo: string;
  isFeatured?: boolean;
}

export interface SavedComparison {
  id: string;
  name: string;
  ad_ids: string[];
  created_at: string;
  updated_at: string;
}

interface ComparisonContextType {
  comparisonAds: ComparisonAd[];
  savedComparisons: SavedComparison[];
  addToComparison: (ad: ComparisonAd) => void;
  removeFromComparison: (adId: string) => void;
  clearComparison: () => void;
  isInComparison: (adId: string) => boolean;
  saveComparison: (name: string) => Promise<void>;
  loadComparison: (comparisonId: string) => Promise<void>;
  deleteComparison: (comparisonId: string) => Promise<void>;
  loadSavedComparisons: () => Promise<void>;
  maxAds: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonAds, setComparisonAds] = useState<ComparisonAd[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const { user } = useAuth();
  const maxAds = 3;

  // Auto-save current comparison when user is logged in and comparison changes
  useEffect(() => {
    if (user && comparisonAds.length > 0) {
      const autoSave = async () => {
        try {
          await saveCurrentComparison();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      };
      
      const timeoutId = setTimeout(autoSave, 1000); // Debounce auto-save
      return () => clearTimeout(timeoutId);
    }
  }, [comparisonAds, user]);

  // Load saved comparisons when user logs in
  useEffect(() => {
    if (user) {
      loadSavedComparisons();
    } else {
      setSavedComparisons([]);
    }
  }, [user]);

  const saveCurrentComparison = async () => {
    if (!user || comparisonAds.length === 0) return;

    const adIds = comparisonAds.map(ad => ad.id);
    
    // Check if there's already an auto-saved comparison
    const { data: existing } = await supabase
      .from('saved_comparisons')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Auto-saved Comparison')
      .single();

    if (existing) {
      // Update existing auto-saved comparison
      await supabase
        .from('saved_comparisons')
        .update({ ad_ids: adIds })
        .eq('id', existing.id);
    } else {
      // Create new auto-saved comparison
      await supabase
        .from('saved_comparisons')
        .insert({
          user_id: user.id,
          name: 'Auto-saved Comparison',
          ad_ids: adIds
        });
    }
  };

  const addToComparison = (ad: ComparisonAd) => {
    if (comparisonAds.length >= maxAds) {
      toast({
        title: "Comparison Limit Reached",
        description: `You can only compare up to ${maxAds} ads at once.`,
        variant: "destructive",
      });
      return;
    }

    if (comparisonAds.some(existingAd => existingAd.id === ad.id)) {
      toast({
        title: "Already in Comparison",
        description: "This ad is already in your comparison list.",
      });
      return;
    }

    setComparisonAds(prev => [...prev, ad]);
    toast({
      title: "Added to Comparison",
      description: `${ad.title} has been added to your comparison.`,
    });
  };

  const removeFromComparison = (adId: string) => {
    setComparisonAds(prev => prev.filter(ad => ad.id !== adId));
    toast({
      title: "Removed from Comparison",
      description: "Ad has been removed from your comparison.",
    });
  };

  const clearComparison = () => {
    setComparisonAds([]);
    toast({
      title: "Comparison Cleared",
      description: "All ads have been removed from your comparison.",
    });
  };

  const isInComparison = (adId: string) => {
    return comparisonAds.some(ad => ad.id === adId);
  };

  const saveComparison = async (name: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save comparisons.",
        variant: "destructive",
      });
      return;
    }

    if (comparisonAds.length === 0) {
      toast({
        title: "No Ads to Save",
        description: "Please add some ads to your comparison first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const adIds = comparisonAds.map(ad => ad.id);
      
      const { error } = await supabase
        .from('saved_comparisons')
        .insert({
          user_id: user.id,
          name,
          ad_ids: adIds
        });

      if (error) throw error;

      toast({
        title: "Comparison Saved",
        description: `"${name}" has been saved to your account.`,
      });

      loadSavedComparisons(); // Refresh the list
    } catch (error) {
      console.error('Error saving comparison:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your comparison.",
        variant: "destructive",
      });
    }
  };

  const loadComparison = async (comparisonId: string) => {
    if (!user) return;

    try {
      // Get the saved comparison
      const { data: comparison, error } = await supabase
        .from('saved_comparisons')
        .select('ad_ids')
        .eq('id', comparisonId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Get the actual ads
      const { data: ads, error: adsError } = await supabase
        .from('ads')
        .select(`
          id, title, price, location, latitude, longitude, created_at, is_featured,
          category_id, condition,
          categories(name),
          ad_images(image_url, is_primary)
        `)
        .in('id', comparison.ad_ids as string[])
        .eq('is_active', true);

      if (adsError) throw adsError;

      // Transform to ComparisonAd format
      const comparisonAds: ComparisonAd[] = ads.map(ad => ({
        id: ad.id,
        title: ad.title,
        price: ad.price ? `$${ad.price}` : 'Contact for price',
        location: ad.location || 'Location not specified',
        imageUrl: ad.ad_images?.find(img => img.is_primary)?.image_url || '/placeholder.svg',
        category: ad.categories?.name || 'Uncategorized',
        condition: ad.condition,
        latitude: ad.latitude,
        longitude: ad.longitude,
        timeAgo: new Date(ad.created_at).toLocaleDateString(),
        isFeatured: ad.is_featured
      }));

      setComparisonAds(comparisonAds);
      
      toast({
        title: "Comparison Loaded",
        description: "Your saved comparison has been loaded.",
      });
    } catch (error) {
      console.error('Error loading comparison:', error);
      toast({
        title: "Load Failed",
        description: "There was an error loading your comparison.",
        variant: "destructive",
      });
    }
  };

  const deleteComparison = async (comparisonId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_comparisons')
        .delete()
        .eq('id', comparisonId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Comparison Deleted",
        description: "Your saved comparison has been deleted.",
      });

      loadSavedComparisons(); // Refresh the list
    } catch (error) {
      console.error('Error deleting comparison:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting your comparison.",
        variant: "destructive",
      });
    }
  };

  const loadSavedComparisons = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_comparisons')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSavedComparisons((data || []).map(item => ({
        ...item,
        ad_ids: item.ad_ids as string[]
      })));
    } catch (error) {
      console.error('Error loading saved comparisons:', error);
    }
  };

  return (
    <ComparisonContext.Provider value={{
      comparisonAds,
      savedComparisons,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison,
      saveComparison,
      loadComparison,
      deleteComparison,
      loadSavedComparisons,
      maxAds
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};