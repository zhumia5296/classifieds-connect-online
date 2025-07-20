import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Filter, X, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/hooks/use-toast';

interface UnifiedSearchBarProps {
  onSearch?: (query: string, location: string) => void;
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
  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [locationQuery, setLocationQuery] = useState(defaultLocation);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const { location, requestLocation, loading: locationLoading } = useLocation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location?.address && !locationQuery) {
      setLocationQuery(location.address);
    }
  }, [location?.address, locationQuery]);

  const handleLocationDetect = async () => {
    try {
      await requestLocation(true);
      if (location?.address) {
        setLocationQuery(location.address);
        setShowLocationInput(false);
      }
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please enable location access or enter your location manually.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = () => {
    const finalLocation = locationQuery || location?.address || "Current location";
    onSearch?.(searchQuery, finalLocation);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="sticky top-16 z-30 bg-gradient-primary p-4 border-b">
      {/* Location Display/Input */}
      <div className="flex items-center justify-between mb-3">
        {!showLocationInput ? (
          <div 
            className="flex items-center gap-2 text-primary-foreground cursor-pointer"
            onClick={() => setShowLocationInput(true)}
          >
            <MapPin className="h-4 w-4 text-primary-glow" />
            <span className="text-sm font-medium truncate flex-1">
              {locationQuery || location?.address || "Tap to set location"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleLocationDetect();
              }}
              disabled={locationLoading}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 h-8 w-8 p-0"
            >
              <Locate className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <Input
              ref={inputRef}
              placeholder="Enter your location"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-8 bg-background/95 backdrop-blur-sm border-white/20 text-foreground"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationInput(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Unified Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search in ${locationQuery || 'your area'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 h-12 bg-background/95 backdrop-blur-sm border-white/20 text-foreground text-base"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={onFilterToggle}
          className="h-12 w-12 shrink-0 bg-background/95 hover:bg-background"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-primary-foreground/80">
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-white/20 text-xs">
            5km
          </Badge>
          <span>radius</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-white/20 text-xs">
            25k+
          </Badge>
          <span>listings</span>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSearchBar;