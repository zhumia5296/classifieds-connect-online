import { useState, useEffect } from 'react';
import { Heart, Search, BookmarkX, Bell, BellOff, Play, Edit, Grid, List, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import AdCard from '@/components/AdCard';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { useNavigate } from 'react-router-dom';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useSavedAds } from '@/hooks/useSavedAds';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('ads');

  // Hooks for data
  const { getSavedAdsWithDetails, isAdSaved, toggleSaveAd } = useSavedAds();
  const { savedSearches, loading: searchesLoading, deleteSavedSearch, toggleNotification } = useSavedSearches();
  
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  // Set up SEO
  useSEO({
    title: 'Favorites & Wishlist - ClassifiedList',
    description: 'View and manage your saved ads and searches',
    keywords: 'saved ads, favorites, bookmarks, classified, saved searches, wishlist'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      loadSavedAds();
    }
  }, [user, authLoading, navigate]);

  const loadSavedAds = async () => {
    setAdsLoading(true);
    try {
      const ads = await getSavedAdsWithDetails();
      setSavedAds(ads);
    } catch (error) {
      console.error('Error loading saved ads:', error);
    } finally {
      setAdsLoading(false);
    }
  };

  const handleUnsaveAd = async (adId: string, adTitle: string) => {
    await toggleSaveAd(adId);
    // Reload the saved ads
    loadSavedAds();
  };

  const handleRunSearch = (search: any) => {
    // Navigate to home with search parameters
    const searchParams = new URLSearchParams();
    
    if (search.search_query) {
      searchParams.set('search', search.search_query);
    }
    
    if (search.filters.location) {
      searchParams.set('location', search.filters.location);
    }
    
    if (search.filters.categories.length > 0) {
      searchParams.set('category', search.filters.categories[0]);
    }
    
    navigate(`/?${searchParams.toString()}`);
  };

  const getSearchSummary = (search: any) => {
    const parts = [];
    
    if (search.search_query) {
      parts.push(`"${search.search_query}"`);
    }
    
    if (search.filters.priceRange?.min || search.filters.priceRange?.max) {
      const min = search.filters.priceRange.min ?? 0;
      const max = search.filters.priceRange.max ?? '∞';
      parts.push(`$${min} - $${max}`);
    }
    
    if (search.filters.location) {
      parts.push(search.filters.location);
    }
    
    if (search.filters.condition) {
      parts.push(search.filters.condition);
    }
    
    if (search.filters.categories?.length > 0) {
      parts.push(`${search.filters.categories.length} categories`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'All ads';
  };

  const filteredAds = savedAds.filter(ad =>
    ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSearches = savedSearches.filter(search =>
    search.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    search.search_query?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || (adsLoading && searchesLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Heart className="h-8 w-8 mr-3 text-red-500" />
                Favorites & Wishlist
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your saved ads and searches
              </p>
            </div>

            {/* View Mode Toggle - only show for ads tab */}
            {activeTab === 'ads' && (
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={`Search ${activeTab === 'ads' ? 'saved ads' : 'saved searches'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ads" className="flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Saved Ads ({savedAds.length})
              </TabsTrigger>
              <TabsTrigger value="searches" className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Saved Searches ({savedSearches.length})
              </TabsTrigger>
            </TabsList>

            {/* Saved Ads Tab */}
            <TabsContent value="ads" className="space-y-4">
              {filteredAds.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchTerm ? 'No matching saved ads' : 'No saved ads yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm 
                        ? 'Try adjusting your search criteria' 
                        : 'Start browsing ads and save the ones you like'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => navigate('/')}>
                        Browse Ads
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {filteredAds.map((ad) => (
                    <div key={ad.id} className="relative group">
                      <AdCard
                        id={ad.id}
                        title={ad.title}
                        price={`${ad.currency || '$'}${ad.price}`}
                        location={ad.location || 'No location'}
                        timeAgo={new Date(ad.created_at).toLocaleDateString()}
                        imageUrl={ad.imageUrl || '/placeholder.svg'}
                        isFeatured={ad.is_featured}
                        category={ad.category || 'Uncategorized'}
                      />
                      
                      {/* Remove button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnsaveAd(ad.id, ad.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      {/* Saved date badge */}
                      <Badge
                        variant="secondary"
                        className="absolute bottom-2 left-2 text-xs"
                      >
                        Saved {new Date(ad.savedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Searches Tab */}
            <TabsContent value="searches" className="space-y-4">
              {filteredSearches.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchTerm ? 'No matching saved searches' : 'No saved searches yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm 
                        ? 'Try adjusting your search criteria' 
                        : 'Save searches to get notified about new matching ads'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => navigate('/')}>
                        Start Searching
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSearches.map((search) => (
                    <Card key={search.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center">
                              <Search className="h-5 w-5 mr-2 text-blue-500" />
                              {search.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getSearchSummary(search)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleNotification(search.id, !search.notification_enabled)}
                              title={search.notification_enabled ? 'Disable notifications' : 'Enable notifications'}
                            >
                              {search.notification_enabled ? (
                                <Bell className="h-4 w-4 text-blue-500" />
                              ) : (
                                <BellOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSavedSearch(search.id, search.name)}
                              title="Delete search"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Created {new Date(search.created_at).toLocaleDateString()}</span>
                            {search.notification_enabled && (
                              <Badge variant="outline" className="text-xs">
                                <Bell className="h-3 w-3 mr-1" />
                                Notifications On
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunSearch(search)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Run Search
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Favorites;