import { useState, useEffect } from 'react';
import { Heart, Search, Filter, Grid, List, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import AdCard from '@/components/AdCard';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SavedAd {
  id: string;
  ad_id: string;
  created_at: string;
  ads: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    location: string;
    created_at: string;
    is_featured: boolean;
    categories: {
      name: string;
    };
    ad_images: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
}

const SavedAds = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Set up SEO
  useSEO({
    title: 'Saved Ads - ClassifiedList',
    description: 'View and manage your saved classified ads',
    keywords: 'saved ads, favorites, bookmarks, classified'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchSavedAds();
    }
  }, [user, authLoading, navigate]);

  const fetchSavedAds = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('saved_ads')
        .select(`
          id,
          ad_id,
          created_at,
          ads (
            id,
            title,
            description,
            price,
            currency,
            location,
            created_at,
            is_featured,
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

      setSavedAds(data || []);
    } catch (error) {
      console.error('Error fetching saved ads:', error);
      toast({
        title: "Error",
        description: "Failed to load saved ads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveAd = async (savedAdId: string, adTitle: string) => {
    try {
      const { error } = await supabase
        .from('saved_ads')
        .delete()
        .eq('id', savedAdId);

      if (error) throw error;

      setSavedAds(prev => prev.filter(item => item.id !== savedAdId));
      
      toast({
        title: "Removed from saved",
        description: `"${adTitle}" has been removed from your saved ads`
      });
    } catch (error) {
      console.error('Error removing saved ad:', error);
      toast({
        title: "Error",
        description: "Failed to remove ad from saved",
        variant: "destructive"
      });
    }
  };

  const filteredAds = savedAds.filter(savedAd =>
    savedAd.ads.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    savedAd.ads.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    savedAd.ads.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
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
                Saved Ads
              </h1>
              <p className="text-muted-foreground mt-2">
                {savedAds.length} {savedAds.length === 1 ? 'ad' : 'ads'} saved
              </p>
            </div>

            {/* View Mode Toggle */}
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
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search saved ads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Content */}
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
              {filteredAds.map((savedAd) => (
                <div key={savedAd.id} className="relative group">
                  <AdCard
                    id={savedAd.ads.id}
                    title={savedAd.ads.title}
                    price={`${savedAd.ads.currency || '$'}${savedAd.ads.price}`}
                    location={savedAd.ads.location || 'No location'}
                    timeAgo={new Date(savedAd.ads.created_at).toLocaleDateString()}
                    imageUrl={savedAd.ads.ad_images?.find(img => img.is_primary)?.image_url || '/placeholder.svg'}
                    isFeatured={savedAd.ads.is_featured}
                    category={savedAd.ads.categories?.name || 'Uncategorized'}
                  />
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnsaveAd(savedAd.id, savedAd.ads.title);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  {/* Saved date badge */}
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2 text-xs"
                  >
                    Saved {new Date(savedAd.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedAds;