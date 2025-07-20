import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/hooks/useLocation';
import { getCurrentLocation } from '@/lib/location';
import { toast } from 'sonner';

interface UnifiedSearchBarProps {
  onSearch?: (query: string, location?: string) => void;
  onFilterToggle?: () => void;
  defaultQuery?: string;
  defaultLocation?: string;
}

const UnifiedSearchBar = ({ 
  onSearch, 
  onFilterToggle, 
  defaultQuery = '',
  defaultLocation = ''
}: UnifiedSearchBarProps) => {
  const [query, setQuery] = useState(defaultQuery);
  const [location, setLocation] = useState(defaultLocation);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const { location: userLocation, loading, requestLocation } = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userLocation && !location) {
      setLocation(userLocation.address || 'Current location');
    }
  }, [userLocation, location]);

  const handleLocationClick = async () => {
    if (loading) return;
    
    try {
      await requestLocation();
      if (userLocation?.address) {
        setLocation(userLocation.address);
        setShowLocationInput(false);
        toast.success('Location updated');
      }
    } catch (error) {
      toast.error('Unable to get your location');
      setShowLocationInput(true);
    }
  };

  const handleSearch = () => {
    onSearch?.(query, location);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationShortcut = (distance: string) => {
    const shortcuts = {
      'walk': 'Walking distance',
      'bike': '5 min bike ride',
      'drive': '10 min drive'
    };
    setLocation(prev => {
      const base = prev?.split(' •')[0] || 'Current location';
      return `${base} • ${shortcuts[distance]}`;
    });
    handleSearch();
  };

  return (
    <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 shadow-sm">
      {/* Unified Search + Location Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted/60 rounded-xl p-1 border border-border/50">
          {/* Search Section */}
          <div className="flex items-center px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            <Input
              ref={searchInputRef}
              placeholder="Search items near you..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:ring-0 flex-1"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="h-6 w-6 p-0 hover:bg-muted-foreground/10"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Location Section */}
          <div className="border-t border-border/30 pt-1">
            {!showLocationInput ? (
              <Button
                variant="ghost"
                onClick={handleLocationClick}
                disabled={loading}
                className="w-full justify-start px-3 py-1.5 h-auto text-left hover:bg-muted/40"
              >
                <div className="flex items-center w-full">
                  {loading ? (
                    <Navigation className="h-3 w-3 text-primary mr-2 animate-pulse" />
                  ) : (
                    <MapPin className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    {loading ? 'Getting location...' : location || 'Tap to set location'}
                  </span>
                </div>
              </Button>
            ) : (
              <div className="flex items-center px-3 py-1.5">
                <MapPin className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                <Input
                  placeholder="Enter location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-0 bg-transparent p-0 text-xs placeholder:text-muted-foreground focus-visible:ring-0"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLocationInput(false)}
                  className="h-5 w-5 p-0 ml-2"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={onFilterToggle}
          className="px-3 py-2 h-10 border-border/50"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Distance Filters */}
      <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Quick filters:</span>
        {[
          { key: 'walk', icon: '🚶', label: 'Walking', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
          { key: 'bike', icon: '🚴', label: '5 min', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
          { key: 'drive', icon: '🚗', label: '10 min', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' }
        ].map(({ key, icon, label, color }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => handleLocationShortcut(key)}
            className={`px-2 py-1 h-6 text-xs rounded-full whitespace-nowrap ${color} hover:opacity-80`}
          >
            <span className="mr-1">{icon}</span>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default UnifiedSearchBar;