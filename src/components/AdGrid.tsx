import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { supabase } from '@/integrations/supabase/client';
import AdCard from "./AdCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  condition: string;
  created_at: string;
  is_featured: boolean;
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
  const { selectedCategory } = useCategoryFilter();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
          price,
          currency,
          location,
          condition,
          created_at,
          is_featured,
          category_id,
          categories(name),
          ad_images(image_url, is_primary),
          saved_ads(id)
        `)
        .eq('is_active', true)
        .eq('status', 'active');

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

      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Only fetch saved_ads for authenticated users
      if (user) {
        query = query.eq('saved_ads.user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const newAds = data || [];
      
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
    fetchAds();
  }, [user, selectedCategory]); // Add selectedCategory as dependency

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
              timeAgo={formatTimeAgo(ad.created_at)}
              imageUrl={getImageUrl(ad.ad_images)}
              isFeatured={ad.is_featured}
              isLiked={ad.saved_ads.length > 0}
              category={ad.categories?.name || 'Other'}
              condition={ad.condition}
              onToggleSave={() => handleToggleSave(ad.id)}
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
  );
};

export default AdGrid;