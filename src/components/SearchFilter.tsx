import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  X,
  MapPin,
  DollarSign,
  Star,
  Calendar,
  TrendingUp,
  Sliders
} from "lucide-react";
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { supabase } from '@/integrations/supabase/client';

export interface FilterOptions {
  priceRange: { min: number | null; max: number | null };
  location: string;
  condition: string;
  sortBy: string;
  dateRange: string;
  featuredOnly: boolean;
  hasImages: boolean;
  categories: string[];
}

interface SearchFilterProps {
  onFiltersChange: (filters: FilterOptions) => void;
}

interface CategoryOption {
  id: string;
  name: string;
  parent_id: string | null;
}

const SearchFilter = ({ onFiltersChange }: SearchFilterProps) => {
  const { searchQuery, setSearchQuery } = useCategoryFilter();
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [priceSliderValue, setPriceSliderValue] = useState([0, 10000]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch categories for multi-select
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('is_active', true)
        .order('sort_order');
      
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Generate search suggestions
  useEffect(() => {
    const generateSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data } = await supabase
        .from('ads')
        .select('title')
        .ilike('title', `%${searchQuery}%`)
        .eq('is_active', true)
        .limit(5);

      if (data) {
        const uniqueTitles = [...new Set(data.map(ad => ad.title))];
        setSuggestions(uniqueTitles);
      }
    };

    const debounce = setTimeout(generateSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 1);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updatePriceRange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newPriceRange = { ...filters.priceRange, [type]: numValue };
    updateFilter('priceRange', newPriceRange);
  };

  const handlePriceSliderChange = (values: number[]) => {
    setPriceSliderValue(values);
    const newPriceRange = { min: values[0] || null, max: values[1] || null };
    updateFilter('priceRange', newPriceRange);
  };

  const toggleCategory = (categoryId: string) => {
    const currentCategories = filters.categories;
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    updateFilter('categories', newCategories);
  };

  const clearAllFilters = () => {
    const defaultFilters: FilterOptions = {
      priceRange: { min: null, max: null },
      location: '',
      condition: '',
      sortBy: 'newest',
      dateRange: 'all',
      featuredOnly: false,
      hasImages: false,
      categories: []
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setSearchQuery('');
    setPriceSliderValue([0, 10000]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.location) count++;
    if (filters.condition) count++;
    if (filters.sortBy !== 'newest') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.featuredOnly) count++;
    if (filters.hasImages) count++;
    if (filters.categories.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const parentCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId);

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Enhanced Search Input with Suggestions */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by title, description, or location..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(searchQuery.length > 1)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-t-0 rounded-b-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                    onClick={() => {
                      handleSearchChange(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Sort Select */}
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="featured">Featured First</SelectItem>
              <SelectItem value="popular">Most Viewed</SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Sliders className="h-4 w-4 mr-2" />
                Quick
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-background z-50">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={filters.featuredOnly}
                    onCheckedChange={(checked) => updateFilter('featuredOnly', checked)}
                  />
                  <Label htmlFor="featured" className="text-sm">Featured ads only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="images"
                    checked={filters.hasImages}
                    onCheckedChange={(checked) => updateFilter('hasImages', checked)}
                  />
                  <Label htmlFor="images" className="text-sm">Ads with images</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Date Range</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => updateFilter('dateRange', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Advanced Filters Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Advanced
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 px-1.5 py-0.5 text-xs h-5 min-w-5"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>
                  Fine-tune your search with detailed filters
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Enhanced Price Range with Presets */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Price Range</h3>
                    </div>
                    {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          updateFilter('priceRange', { min: null, max: null });
                          setPriceSliderValue([0, 10000]);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Price Presets */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Under $100', min: null, max: 100 },
                        { label: '$100-$500', min: 100, max: 500 },
                        { label: '$500-$1K', min: 500, max: 1000 },
                        { label: '$1K-$5K', min: 1000, max: 5000 },
                        { label: '$5K-$10K', min: 5000, max: 10000 },
                        { label: 'Over $10K', min: 10000, max: null }
                      ].map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs justify-start"
                          onClick={() => {
                            updateFilter('priceRange', { min: preset.min, max: preset.max });
                            setPriceSliderValue([preset.min || 0, preset.max || 10000]);
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="px-2">
                      <Slider
                        value={priceSliderValue}
                        onValueChange={handlePriceSliderChange}
                        max={10000}
                        step={50}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>${priceSliderValue[0].toLocaleString()}</span>
                        <span>${priceSliderValue[1].toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min price"
                        value={filters.priceRange.min ?? ''}
                        onChange={(e) => updatePriceRange('min', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max price"
                        value={filters.priceRange.max ?? ''}
                        onChange={(e) => updatePriceRange('max', e.target.value)}
                      />
                    </div>
                    
                    {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        Showing items {filters.priceRange.min !== null ? `from $${filters.priceRange.min.toLocaleString()}` : ''} 
                        {filters.priceRange.min !== null && filters.priceRange.max !== null ? ' ' : ''}
                        {filters.priceRange.max !== null ? `to $${filters.priceRange.max.toLocaleString()}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location with Popular Cities */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Location</h3>
                  </div>
                  <Input
                    placeholder="City, state, or zip code"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                  />
                  <div className="flex flex-wrap gap-1">
                    {['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'].map((city) => (
                      <Button
                        key={city}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => updateFilter('location', city)}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Multi-Category Selection */}
                <div className="space-y-3">
                  <h3 className="font-medium">Categories</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parentCategories.map((category) => {
                      const subcategories = getSubcategories(category.id);
                      return (
                        <div key={category.id} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={category.id}
                              checked={filters.categories.includes(category.id)}
                              onCheckedChange={() => toggleCategory(category.id)}
                            />
                            <Label htmlFor={category.id} className="text-sm font-medium">
                              {category.name}
                            </Label>
                          </div>
                          
                          {subcategories.length > 0 && (
                            <div className="ml-6 space-y-1">
                              {subcategories.map((sub) => (
                                <div key={sub.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={sub.id}
                                    checked={filters.categories.includes(sub.id)}
                                    onCheckedChange={() => toggleCategory(sub.id)}
                                  />
                                  <Label htmlFor={sub.id} className="text-sm text-muted-foreground">
                                    {sub.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Condition Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Condition</h3>
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={filters.condition}
                      onValueChange={(value) => updateFilter('condition', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any condition" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="">Any condition</SelectItem>
                        <SelectItem value="new">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>New</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="like-new">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span>Like New</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="good">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span>Good</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fair">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span>Fair</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="poor">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span>Poor</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {filters.condition && (
                      <div className="text-xs text-muted-foreground">
                        {filters.condition === 'new' && 'Brand new items, never used'}
                        {filters.condition === 'like-new' && 'Minimal wear, excellent condition'}
                        {filters.condition === 'good' && 'Some wear but functions perfectly'}
                        {filters.condition === 'fair' && 'Visible wear, may need minor repairs'}
                        {filters.condition === 'poor' && 'Significant wear, functional issues possible'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <h3 className="font-medium">Additional Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured-filter"
                        checked={filters.featuredOnly}
                        onCheckedChange={(checked) => updateFilter('featuredOnly', checked)}
                      />
                      <Label htmlFor="featured-filter" className="text-sm">
                        Featured ads only
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="images-filter"
                        checked={filters.hasImages}
                        onCheckedChange={(checked) => updateFilter('hasImages', checked)}
                      />
                      <Label htmlFor="images-filter" className="text-sm">
                        Ads with images only
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Date Posted</h3>
                  </div>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => updateFilter('dateRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || activeFiltersCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchQuery}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleSearchChange('')}
                />
              </Badge>
            )}
            
            {filters.priceRange.min !== null && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min: ${filters.priceRange.min}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updatePriceRange('min', '')}
                />
              </Badge>
            )}
            
            {filters.priceRange.max !== null && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Max: ${filters.priceRange.max}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updatePriceRange('max', '')}
                />
              </Badge>
            )}
            
            {filters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Location: {filters.location}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('location', '')}
                />
              </Badge>
            )}
            
            {filters.condition && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Condition: {filters.condition}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('condition', '')}
                />
              </Badge>
            )}
            
            {filters.featuredOnly && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Featured only
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('featuredOnly', false)}
                />
              </Badge>
            )}
            
            {filters.hasImages && (
              <Badge variant="secondary" className="flex items-center gap-1">
                With images
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('hasImages', false)}
                />
              </Badge>
            )}
            
            {filters.categories.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Categories: {filters.categories.length}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('categories', [])}
                />
              </Badge>
            )}
            
            {filters.dateRange !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {filters.dateRange}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('dateRange', 'all')}
                />
              </Badge>
            )}
            
            {filters.sortBy !== 'newest' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Sort: {filters.sortBy.replace('-', ' ')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('sortBy', 'newest')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;