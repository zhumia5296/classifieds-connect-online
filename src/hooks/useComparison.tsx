import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

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

interface ComparisonContextType {
  comparisonAds: ComparisonAd[];
  addToComparison: (ad: ComparisonAd) => void;
  removeFromComparison: (adId: string) => void;
  clearComparison: () => void;
  isInComparison: (adId: string) => boolean;
  maxAds: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonAds, setComparisonAds] = useState<ComparisonAd[]>([]);
  const maxAds = 3;

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

  return (
    <ComparisonContext.Provider value={{
      comparisonAds,
      addToComparison,
      removeFromComparison,
      clearComparison,
      isInComparison,
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