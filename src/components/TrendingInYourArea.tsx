import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Search, 
  Tag, 
  MapPin, 
  Eye, 
  Clock,
  ArrowUpRight,
  Flame
} from 'lucide-react';
import { useTrendingItems, TrendingItem } from '@/hooks/useTrendingItems';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TrendingInYourAreaProps {
  locationArea?: string;
  className?: string;
}

const TrendingInYourArea: React.FC<TrendingInYourAreaProps> = ({ 
  locationArea, 
  className 
}) => {
  const { 
    trendingAds, 
    trendingSearches, 
    trendingCategories, 
    loading, 
    error,
    trackActivity 
  } = useTrendingItems(locationArea);

  const [userLocation, setUserLocation] = useState<string>('your area');

  useEffect(() => {
    // Get user's location for display
    if (locationArea) {
      setUserLocation(locationArea);
    } else {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.state;
            if (city) setUserLocation(city);
          } catch (error) {
            console.warn('Could not get location name:', error);
          }
        },
        () => {
          // Location access denied - keep default
        },
        { timeout: 5000 }
      );
    }
  }, [locationArea]);

  const getTrendIcon = (score: number) => {
    if (score > 50) return <Flame className="h-4 w-4 text-red-500" />;
    if (score > 20) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
  };

  const handleSearchClick = (searchTerm: string) => {
    trackActivity('search', 'search', undefined, searchTerm);
  };

  const handleCategoryClick = (categoryId: string) => {
    trackActivity('category', 'view', undefined, undefined, categoryId);
  };

  const handleAdClick = (adId: string) => {
    trackActivity('ad', 'view', adId);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending in {userLocation}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending in {userLocation}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load trending items at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasAnyTrending = trendingAds.length > 0 || trendingSearches.length > 0 || trendingCategories.length > 0;

  if (!hasAnyTrending) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending in {userLocation}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No trending items yet in your area. Be the first to start exploring!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Trending in {userLocation}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Live data
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="searches" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="searches" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              Searches
              {trendingSearches.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {trendingSearches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              Categories
              {trendingCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {trendingCategories.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="items" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Items
              {trendingAds.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {trendingAds.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="searches" className="space-y-2">
            {trendingSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trending searches yet
              </p>
            ) : (
              trendingSearches.slice(0, 6).map((item, index) => (
                <Button
                  key={`search-${index}`}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-auto p-2"
                  asChild
                >
                  <Link 
                    to={`/search?q=${encodeURIComponent(item.search_term || '')}`}
                    onClick={() => handleSearchClick(item.search_term || '')}
                  >
                    <div className="flex items-center gap-2 flex-1 text-left">
                      {getTrendIcon(item.trend_score)}
                      <span className="text-sm font-medium truncate">
                        "{item.search_term}"
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.search_count} searches</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(item.last_activity_at), { addSuffix: true })}</span>
                    </div>
                  </Link>
                </Button>
              ))
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-2">
            {trendingCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trending categories yet
              </p>
            ) : (
              trendingCategories.slice(0, 6).map((item, index) => (
                <Button
                  key={`category-${index}`}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-auto p-2"
                  onClick={() => handleCategoryClick(item.category_id || '')}
                >
                  <div className="flex items-center gap-2 flex-1 text-left">
                    {getTrendIcon(item.trend_score)}
                    <Tag className="h-3 w-3" />
                    <span className="text-sm font-medium">
                      Category {item.category_id?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.view_count} views</span>
                  </div>
                </Button>
              ))
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-2">
            {trendingAds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trending items yet
              </p>
            ) : (
              trendingAds.slice(0, 5).map((item, index) => (
                <Button
                  key={`ad-${index}`}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-auto p-2"
                  asChild
                >
                  <Link 
                    to={`/ad/${item.item_id}`}
                    onClick={() => handleAdClick(item.item_id || '')}
                  >
                    <div className="flex items-center gap-2 flex-1 text-left">
                      {getTrendIcon(item.trend_score)}
                      <span className="text-sm font-medium">
                        Popular Item #{item.item_id?.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{item.view_count} views</span>
                    </div>
                  </Link>
                </Button>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrendingInYourArea;
