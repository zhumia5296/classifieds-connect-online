import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useIsMobile } from '@/hooks/use-mobile';
import { RefreshCw, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import MobileAdCard from './MobileAdCard';

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  condition: string;
  created_at: string;
  is_featured: boolean;
  featured_until?: string;
  user_id: string;
  categories: {
    name: string;
  } | null;
  ad_images: {
    image_url: string;
    is_primary: boolean;
  }[];
  saved_ads: {
    id: string;
  }[];
}

interface MobileAdGridProps {
  ads: Ad[];
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onToggleSave: (adId: string) => void;
  onToggleFilters?: () => void;
}

const MobileAdGrid = ({
  ads,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  onRefresh,
  onToggleSave,
  onToggleFilters
}: MobileAdGridProps) => {
  const { user } = useAuth();
  const { location: userLocation } = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [refreshing, setRefreshing] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const lastAdElementRef = useRef<HTMLDivElement>();

  // Infinite scroll
  const lastAdRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasMore, onLoadMore]);

  // Pull to refresh simulation
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    onRefresh();
    setRefreshing(false);
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Contact for price';
    
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$'
    };

    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getImageUrl = (adImages: Ad['ad_images']) => {
    const primaryImage = adImages.find(img => img.is_primary);
    const fallbackImage = adImages[0];
    const defaultImage = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop";
    
    return primaryImage?.image_url || fallbackImage?.image_url || defaultImage;
  };

  const getImages = (adImages: Ad['ad_images']) => {
    return adImages.map(img => img.image_url);
  };

  if (!isMobile) {
    return null; // Only show on mobile
  }

  if (loading && ads.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-20" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No ads found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or location
          </p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Header with stats and filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {ads.length} listings
          </span>
          {userLocation?.address && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              Near you
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          {onToggleFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFilters}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-optimized grid */}
      <div className="grid grid-cols-1 gap-4">
        {ads.map((ad, index) => (
          <div
            key={ad.id}
            ref={index === ads.length - 1 ? lastAdRef : undefined}
          >
            <MobileAdCard
              id={ad.id}
              title={ad.title}
              price={formatPrice(ad.price, ad.currency)}
              location={ad.location}
              latitude={ad.latitude}
              longitude={ad.longitude}
              timeAgo={formatTimeAgo(ad.created_at)}
              imageUrl={getImageUrl(ad.ad_images)}
              images={getImages(ad.ad_images)}
              isFeatured={ad.is_featured && ad.featured_until && new Date(ad.featured_until) > new Date()}
              isLiked={ad.saved_ads.length > 0}
              category={ad.categories?.name || 'Other'}
              condition={ad.condition}
              sellerId={ad.user_id}
              onToggleSave={() => onToggleSave(ad.id)}
              onContact={() => {
                // Handle contact action
                if (!user) {
                  toast({
                    title: "Sign in required",
                    description: "Please sign in to contact sellers.",
                    variant: "destructive"
                  });
                  return;
                }
                window.location.href = `/ad/${ad.id}`;
              }}
            />
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && ads.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            You've seen all listings
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileAdGrid;