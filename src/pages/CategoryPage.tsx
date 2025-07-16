import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Filter, Grid, List, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import AdGrid from '@/components/AdGrid';
import Navbar from '@/components/Navbar';
import SearchFilter from '@/components/SearchFilter';
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';

// Icon mapping
const iconMap: Record<string, any> = {
  'smartphone': '📱',
  'car': '🚗',
  'home': '🏠',
  'briefcase': '💼',
  'tag': '🏷️',
  'building': '🏢',
  'users': '👥',
  'heart': '❤️',
  'sofa': '🛋️',
  'wrench': '🔧',
  'graduation-cap': '🎓',
  'shirt': '👕',
  'gamepad2': '🎮',
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
}

interface CategoryStats {
  total_ads: number;
  recent_ads: number;
  avg_price: number;
  top_locations: Array<{ location: string; count: number }>;
}

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setSelectedCategory } = useCategoryFilter();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (slug) {
      fetchCategoryData(slug);
    }
  }, [slug]);

  // Set up SEO
  useSEO({
    title: category ? `${category.name} - ClassifiedList` : 'Category - ClassifiedList',
    description: category?.description || `Browse ${category?.name} listings on ClassifiedList`,
    keywords: `${category?.name}, marketplace, classifieds, buy, sell`
  });

  const fetchCategoryData = async (categorySlug: string) => {
    try {
      setLoading(true);
      
      // Fetch category details
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!categoryData) {
        navigate('/');
        return;
      }

      setCategory(categoryData);
      setSelectedCategory(categoryData.id);

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryData.id)
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (subcategoriesError) throw subcategoriesError;
      setSubcategories(subcategoriesData || []);

      // Fetch category statistics
      await fetchCategoryStats(categoryData.id);

    } catch (error) {
      console.error('Error fetching category data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async (categoryId: string) => {
    try {
      // Get all related category IDs (including subcategories)
      const relatedCategoryIds = [categoryId];
      subcategories.forEach(sub => relatedCategoryIds.push(sub.id));

      // Fetch ads statistics
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('price, location, created_at')
        .in('category_id', relatedCategoryIds)
        .eq('is_active', true)
        .eq('status', 'active');

      if (adsError) throw adsError;

      const total_ads = adsData?.length || 0;
      const recent_ads = adsData?.filter(ad => 
        new Date(ad.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      const prices = adsData?.filter(ad => ad.price).map(ad => ad.price) || [];
      const avg_price = prices.length > 0 
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
        : 0;

      // Top locations
      const locationCounts: Record<string, number> = {};
      adsData?.forEach(ad => {
        if (ad.location) {
          locationCounts[ad.location] = (locationCounts[ad.location] || 0) + 1;
        }
      });

      const top_locations = Object.entries(locationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));

      setStats({
        total_ads,
        recent_ads,
        avg_price,
        top_locations
      });

    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  const categoryIcon = category.icon ? iconMap[category.icon] || '📂' : '📂';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-4xl">{categoryIcon}</div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground mt-1">{category.description}</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold text-primary">{stats.total_ads.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
              </Card>
              
              <Card className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.recent_ads.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">New This Week</p>
              </Card>
              
              {stats.avg_price > 0 && (
                <Card className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{formatPrice(stats.avg_price)}</div>
                  <p className="text-sm text-muted-foreground">Avg. Price</p>
                </Card>
              )}
              
              <Card className="p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.top_locations.length}</div>
                <p className="text-sm text-muted-foreground">Active Locations</p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <h2 className="text-lg font-semibold mb-3">Browse Subcategories</h2>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((subcat) => {
                const subIcon = subcat.icon ? iconMap[subcat.icon] || '📂' : '📂';
                return (
                  <Button
                    key={subcat.id}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/category/${subcat.slug}`)}
                    className="flex items-center space-x-2"
                  >
                    <span>{subIcon}</span>
                    <span>{subcat.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Locations */}
      {stats && stats.top_locations.length > 0 && (
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <h3 className="text-md font-medium mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Popular Locations
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.top_locations.map((loc, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {loc.location} ({loc.count})
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="listings" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="listings">All Listings</TabsTrigger>
              <TabsTrigger value="insights">Market Insights</TabsTrigger>
            </TabsList>
            
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

          <TabsContent value="listings" className="space-y-6">
            <SearchFilter onFiltersChange={() => {}} />
            <AdGrid key={category.id} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Active Listings</span>
                      <span className="font-medium">{stats?.total_ads.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New This Week</span>
                      <span className="font-medium text-green-600">{stats?.recent_ads.toLocaleString() || 0}</span>
                    </div>
                    {stats && stats.avg_price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Price</span>
                        <span className="font-medium">{formatPrice(stats.avg_price)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Top Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.top_locations.map((location, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{location.location}</span>
                        <Badge variant="outline">{location.count} listings</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryPage;