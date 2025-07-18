import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import AdCard from '@/components/AdCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Filter, SlidersHorizontal, Grid, List, MapPin, X, Calendar as CalendarIcon, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import type { DateRange } from 'react-day-picker';

type Ad = Tables<'ads'> & {
  ad_images?: Tables<'ad_images'>[];
  categories?: Tables<'categories'>;
};

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'featured';
type ViewMode = 'grid' | 'list';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const itemsPerPage = 20;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('price_min') || '',
    max: searchParams.get('price_max') || ''
  });
  const [priceSlider, setPriceSlider] = useState([0, 10000]);
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  
  // Advanced filters
  const [distanceRange, setDistanceRange] = useState(parseInt(searchParams.get('distance') || '0'));
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featured') === 'true');
  const [hasImages, setHasImages] = useState(searchParams.get('images') === 'true');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
  // Manual location input for distance filtering
  const [manualLocation, setManualLocation] = useState({
    latitude: '',
    longitude: ''
  });

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) setCategories(data);
    };
    
    fetchCategories();
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceRange.min) params.set('price_min', priceRange.min);
    if (priceRange.max) params.set('price_max', priceRange.max);
    if (location) params.set('location', location);
    if (condition) params.set('condition', condition);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchTerm, selectedCategory, priceRange, location, condition, sortBy, currentPage, setSearchParams]);

  // Fetch search results
  const fetchResults = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ads')
        .select(`
          *,
          ad_images(*),
          categories(*)
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'active');

      // Apply search term filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply price range filter
      if (priceRange.min) {
        query = query.gte('price', parseFloat(priceRange.min));
      }
      if (priceRange.max) {
        query = query.lte('price', parseFloat(priceRange.max));
      }

      // Apply location filter
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      // Apply condition filter
      if (condition && condition !== 'all') {
        query = query.eq('condition', condition);
      }

      // Apply date filter
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = subDays(now, 1);
            break;
          case 'week':
            startDate = subWeeks(now, 1);
            break;
          case 'month':
            startDate = subMonths(now, 1);
            break;
          case 'custom':
            if (customDateRange?.from) {
              query = query.gte('created_at', customDateRange.from.toISOString());
            }
            if (customDateRange?.to) {
              query = query.lte('created_at', customDateRange.to.toISOString());
            }
            break;
          default:
            startDate = new Date(0);
        }
        
        if (dateFilter !== 'custom' && startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false, nullsFirst: false });
          break;
        case 'featured':
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      // Apply pagination
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      setAds(data as Ad[] || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching search results:', error);
      toast({
        title: "Error",
        description: "Failed to load search results. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [searchTerm, selectedCategory, priceRange, location, condition, sortBy, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchResults();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setLocation('');
    setCondition('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory) count++;
    if (priceRange.min || priceRange.max) count++;
    if (location) count++;
    if (condition) count++;
    return count;
  };

  const renderAdGrid = () => {
    if (loading) {
      return (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {ads.map((ad) => {
          const primaryImage = ad.ad_images?.find(img => img.is_primary) || ad.ad_images?.[0];
          const allImages = ad.ad_images?.map(img => img.image_url) || [];
          
          return (
            <AdCard 
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={ad.price ? `${ad.currency || 'USD'} ${ad.price}` : 'Price not specified'}
              location={ad.location || 'Location not specified'}
              latitude={ad.latitude || undefined}
              longitude={ad.longitude || undefined}
              timeAgo={new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                Math.round((new Date(ad.created_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                'day'
              )}
              imageUrl={primaryImage?.image_url || '/placeholder.svg'}
              images={allImages}
              category={ad.categories?.name || 'Uncategorized'}
              condition={ad.condition || undefined}
              isFeatured={ad.is_featured}
              featuredUntil={ad.featured_until || undefined}
              sellerId={ad.user_id}
            />
          );
        })}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Search Results</h1>
              <p className="text-muted-foreground mt-2">
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                  </>
                )}
              </p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md w-full lg:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search ads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
            </form>
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(priceRange.min || priceRange.max) && (
                <Badge variant="secondary" className="gap-1">
                  Price: {priceRange.min || '0'} - {priceRange.max || '∞'}
                  <button
                    onClick={() => setPriceRange({ min: '', max: '' })}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                  <button
                    onClick={() => setLocation('')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {condition && (
                <Badge variant="secondary" className="gap-1">
                  {condition}
                  <button
                    onClick={() => setCondition('')}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <div className="lg:w-80">
            <Card className={`lg:sticky lg:top-6 ${showFilters ? '' : 'hidden lg:block'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">{activeFiltersCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory || 'all'} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Enter location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Condition</label>
                  <Select value={condition || 'all'} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Slider */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Price Range: ${priceSlider[0]} - ${priceSlider[1]}
                  </label>
                  <Slider
                    value={priceSlider}
                    onValueChange={(value) => {
                      setPriceSlider(value);
                      setPriceRange({
                        min: value[0].toString(),
                        max: value[1].toString()
                      });
                    }}
                    min={0}
                    max={50000}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Distance Filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Distance: {distanceRange === 0 ? 'Any distance' : `${distanceRange} km`}
                  </label>
                  <Slider
                    value={[distanceRange]}
                    onValueChange={(value) => setDistanceRange(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Requires location access or manual coordinates
                  </div>
                </div>

                {/* Date Filters */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Posted Date</label>
                  <Select value={dateFilter || 'all'} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateFilter === 'custom' && (
                    <div className="mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange?.from ? (
                              customDateRange.to ? (
                                <>
                                  {format(customDateRange.from, "LLL dd, y")} -{" "}
                                  {format(customDateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(customDateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={customDateRange?.from}
                            selected={customDateRange}
                            onSelect={(range) => setCustomDateRange(range || { from: undefined, to: undefined })}
                            numberOfMonths={2}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Additional Options</label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={featuredOnly}
                      onCheckedChange={(checked) => setFeaturedOnly(checked as boolean)}
                    />
                    <Label htmlFor="featured" className="text-sm">Featured ads only</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="images"
                      checked={hasImages}
                      onCheckedChange={(checked) => setHasImages(checked as boolean)}
                    />
                    <Label htmlFor="images" className="text-sm">Has images</Label>
                  </div>
                </div>

                {/* Manual Location Input for Distance */}
                {distanceRange > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Location (for distance)</label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Latitude"
                        type="number"
                        step="any"
                        value={manualLocation.latitude}
                        onChange={(e) => setManualLocation(prev => ({ ...prev, latitude: e.target.value }))}
                      />
                      <Input
                        placeholder="Longitude"
                        type="number"
                        step="any"
                        value={manualLocation.longitude}
                        onChange={(e) => setManualLocation(prev => ({ ...prev, longitude: e.target.value }))}
                      />
                      <div className="text-xs text-muted-foreground">
                        Use GPS coordinates or enable location access
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                {/* View mode toggle */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="featured">Featured first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results */}
            {renderAdGrid()}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* No results message */}
            {!loading && ads.length === 0 && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;