import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEnhancedMobile } from '@/hooks/useEnhancedMobile';
import { usePullToRefresh } from '@/hooks/useTouchGestures';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  SlidersHorizontal, 
  RefreshCw,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  selectedFiltersCount: number;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export const MobileFilterBar: React.FC<MobileFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  showAdvanced,
  onToggleAdvanced,
  selectedFiltersCount,
  onClearFilters,
  isLoading = false
}) => {
  const { triggerHapticFeedback, shouldUseReducedData } = useEnhancedMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { pullToRefreshHandlers, isPulling, pullProgress } = usePullToRefresh(async () => {
    setIsRefreshing(true);
    triggerHapticFeedback('light');
    await onRefresh();
    setIsRefreshing(false);
  });

  const handleFilterToggle = () => {
    triggerHapticFeedback('light');
    onToggleAdvanced();
  };

  const handleClearFilters = () => {
    triggerHapticFeedback('medium');
    onClearFilters();
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                pullProgress >= 1 ? "animate-spin" : ""
              )}
              style={{ 
                transform: `rotate(${pullProgress * 180}deg)` 
              }}
            />
            {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        </div>
      )}

      <div {...pullToRefreshHandlers} className="p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ads..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 h-12 text-16 rounded-xl border-2 focus:border-primary"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={showAdvanced ? "default" : "outline"}
            size="sm"
            onClick={handleFilterToggle}
            className={cn(
              "flex items-center gap-2 h-10 px-3 rounded-lg transition-all duration-200",
              showAdvanced && "bg-primary text-primary-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {selectedFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-background/20 text-xs ml-1">
                {selectedFiltersCount}
              </Badge>
            )}
          </Button>

          {selectedFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2 h-10 px-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}

          <div className="flex-1" />

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="h-10 w-10 p-0"
          >
            <RefreshCw className={cn(
              "h-4 w-4 transition-transform duration-200",
              (isLoading || isRefreshing) && "animate-spin"
            )} />
          </Button>

          {/* Data saver indicator */}
          {shouldUseReducedData() && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Data Saver</span>
            </div>
          )}
        </div>

        {/* Quick filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { label: 'Active', key: 'active' },
            { label: 'Featured', key: 'featured' },
            { label: 'Recent', key: 'recent' },
            { label: 'High Views', key: 'views' }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-8 px-3 text-xs rounded-full border-2 hover:border-primary whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};