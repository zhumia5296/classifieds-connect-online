import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { useFeaturedAdsCleanup } from '@/hooks/useFeaturedAdsCleanup';
import { useSavedAds } from '@/hooks/useSavedAds';
import { supabase } from '@/integrations/supabase/client';
import AdCard from "./AdCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import SearchFilter, { FilterOptions } from './SearchFilter';

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

const AdGrid = () => {
  const { user } = useAuth();
  const { selectedCategory, searchQuery } = useCategoryFilter();
  const { toast } = useToast();
  const { cleanupComplete } = useFeaturedAdsCleanup();
  const { toggleSaveAd, isAdSaved } = useSavedAds();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: null, max: null },
    location: '',
    condition: '',
    sortBy: 'newest',
    dateRange: 'all',
    featuredOnly: false,
    hasImages: false,
    categories: []
  });

  const ITEMS_PER_PAGE = 12;

  const fetchAds = async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('ads')
        .select(`
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
          is_featured,
          featured_until,
          user_id,
          category_id,
          categories(name),
          ad_images(image_url, is_primary),
          saved_ads(id)
        `)
        .eq('is_active', true)
        .eq('status', 'active');

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      // Apply category filter if selected
      if (selectedCategory) {
        // First check if it's a parent category by looking for subcategories
        const { data: subcategories } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', selectedCategory);
        
        if (subcategories && subcategories.length > 0) {
          // If it has subcategories, include both parent and children
          const categoryIds = [selectedCategory, ...subcategories.map(sub => sub.id)];
          query = query.in('category_id', categoryIds);
        } else {
          // If no subcategories, just filter by the category
          query = query.eq('category_id', selectedCategory);
        }
      }

      // Apply additional filters
      if (filters.priceRange.min !== null) {
        query = query.gte('price', filters.priceRange.min);
      }
      if (filters.priceRange.max !== null) {
        query = query.lte('price', filters.priceRange.max);
      }
      if (filters.location.trim()) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Apply feature filter
      if (filters.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      // Apply image filter
      if (filters.hasImages) {
        query = query.not('ad_images', 'is', null);
      }

      // Apply category filters (multi-select)
      if (filters.categories.length > 0) {
        query = query.in('category_id', filters.categories);
      }

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let dateFilter: string;
        
        switch (filters.dateRange) {
          case 'today':
            now.setHours(0, 0, 0, 0);
            dateFilter = now.toISOString();
            break;
          case 'week':
            now.setDate(now.getDate() - 7);
            dateFilter = now.toISOString();
            break;
          case 'month':
            now.setMonth(now.getMonth() - 1);
            dateFilter = now.toISOString();
            break;
          case '3months':
            now.setMonth(now.getMonth() - 3);
            dateFilter = now.toISOString();
            break;
          default:
            dateFilter = '';
        }
        
        if (dateFilter) {
          query = query.gte('created_at', dateFilter);
        }
      }

      // Featured ads sorting - prioritize active featured ads
      const isActiveFeatured = (ad: any) => {
        if (!ad.is_featured || !ad.featured_until) return false;
        return new Date(ad.featured_until) > new Date();
      };

      // Apply sorting with featured ads priority
      switch (filters.sortBy) {
        case 'oldest':
          query = query.order('is_featured', { ascending: false })
                     .order('created_at', { ascending: true });
          break;
        case 'price-low':
          query = query.order('is_featured', { ascending: false })
                     .order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('is_featured', { ascending: false })
                     .order('price', { ascending: false });
          break;
        case 'title':
          query = query.order('is_featured', { ascending: false })
                     .order('title', { ascending: true });
          break;
        case 'featured':
          query = query.order('is_featured', { ascending: false })
                     .order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('is_featured', { ascending: false })
                     .order('views_count', { ascending: false });
          break;
        default: // newest
          query = query.order('is_featured', { ascending: false })
                     .order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      // Only fetch saved_ads for authenticated users
      if (user) {
        query = query.eq('saved_ads.user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let newAds = data || [];
      
      // Filter out expired featured ads and sort properly
      newAds = newAds.map(ad => ({
        ...ad,
        is_featured: ad.is_featured && ad.featured_until && new Date(ad.featured_until) > new Date()
      }));
      
      // Sort to ensure featured ads are always at the top
      newAds.sort((a, b) => {
        // First by featured status
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        
        // Then by creation date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      if (append) {
        setAds(prev => [...prev, ...newAds]);
      } else {
        setAds(newAds);
      }

      setHasMore(newAds.length === ITEMS_PER_PAGE);
      
    } catch (err) {
      console.error('Error fetching ads:', err);
      setError('Failed to load ads. Please try again.');
      toast({
        title: "Error loading ads",
        description: "Something went wrong while fetching the latest listings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setAds([]);
    fetchAds();
  }, [user, selectedCategory, searchQuery, filters]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAds(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(0);
    setAds([]); // Clear existing ads when refreshing
    fetchAds();
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(0);
    setAds([]);
  };

  const handleToggleSave = async (adId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save ads.",
        variant: "destructive"
      });
      return;
    }

    try {
      const ad = ads.find(a => a.id === adId);
      const isSaved = ad?.saved_ads.length > 0;

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_ads')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', adId);

        if (error) throw error;

        // Update local state
        setAds(prev => prev.map(ad => 
          ad.id === adId 
            ? { ...ad, saved_ads: [] }
            : ad
        ));

        toast({
          title: "Removed from saved",
          description: "Ad removed from your saved list.",
        });
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_ads')
          .insert({
            user_id: user.id,
            ad_id: adId
          });

        if (error) throw error;

        // Update local state
        setAds(prev => prev.map(ad => 
          ad.id === adId 
            ? { ...ad, saved_ads: [{ id: 'temp' }] }
            : ad
        ));

        toast({
          title: "Added to saved",
          description: "Ad added to your saved list.",
        });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      toast({
        title: "Error",
        description: "Failed to update saved status.",
        variant: "destructive"
      });
    }
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

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getImageUrl = (adImages: Ad['ad_images']) => {
    const primaryImage = adImages.find(img => img.is_primary);
    const fallbackImage = adImages[0];
    const defaultImage = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop";
    
    return primaryImage?.image_url || fallbackImage?.image_url || defaultImage;
  };

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest Listings</h2>
              <p className="text-muted-foreground">Discover amazing deals from local sellers</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-8 w-24" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && ads.length === 0) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load ads</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (ads.length === 0) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No ads found</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to post an ad in your area!
            </p>
            <Button onClick={() => window.location.href = '/post-ad'}>
              Post the First Ad
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <SearchFilter onFiltersChange={handleFiltersChange} />
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest Listings</h2>
              <p className="text-muted-foreground">Discover amazing deals from local sellers</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {ads.length} listings
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={formatPrice(ad.price, ad.currency)}
              location={ad.location}
              latitude={ad.latitude}
              longitude={ad.longitude}
              timeAgo={formatTimeAgo(ad.created_at)}
              imageUrl={getImageUrl(ad.ad_images)}
              isFeatured={ad.is_featured}
              featuredUntil={ad.featured_until}
              isLiked={isAdSaved(ad.id)}
              category={ad.categories?.name || 'Other'}
              condition={ad.condition}
              sellerId={ad.user_id}
              isOwner={user?.id === ad.user_id}
              onToggleSave={() => toggleSaveAd(ad.id)}
            />
          ))}
        </div>
        
        {hasMore && (
          <div className="text-center mt-12">
            <Button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Listings'
              )}
            </Button>
          </div>
        )}
        </div>
      </section>
    </>
  );
};

export default AdGrid;