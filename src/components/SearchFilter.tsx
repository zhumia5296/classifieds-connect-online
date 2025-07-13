import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search, 
  Filter, 
  X,
  MapPin,
  DollarSign,
  Star
} from "lucide-react";
import { useCategoryFilter } from '@/hooks/useCategoryFilter';

export interface FilterOptions {
  priceRange: { min: number | null; max: number | null };
  location: string;
  condition: string;
  sortBy: string;
}

interface SearchFilterProps {
  onFiltersChange: (filters: FilterOptions) => void;
}

const SearchFilter = ({ onFiltersChange }: SearchFilterProps) => {
  const { searchQuery, setSearchQuery } = useCategoryFilter();
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: null, max: null },
    location: '',
    condition: '',
    sortBy: 'newest'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
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

  const clearAllFilters = () => {
    const defaultFilters: FilterOptions = {
      priceRange: { min: null, max: null },
      location: '',
      condition: '',
      sortBy: 'newest'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.location) count++;
    if (filters.condition) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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
          </div>

          {/* Sort Select */}
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
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
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Ads</SheetTitle>
                <SheetDescription>
                  Refine your search with additional filters
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Price Range</h3>
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
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Location</h3>
                  </div>
                  <Input
                    placeholder="City or region"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                  />
                </div>

                {/* Condition */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Condition</h3>
                  </div>
                  <Select
                    value={filters.condition}
                    onValueChange={(value) => updateFilter('condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
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
                    Clear All Filters
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