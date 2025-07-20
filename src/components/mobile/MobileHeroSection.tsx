import { Search, MapPin, Locate, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "@/hooks/useLocation";
import { useState } from "react";

interface MobileHeroSectionProps {
  onLocationDetect?: () => void;
  onSearch?: (query: string, location: string) => void;
  onToggleFilters?: () => void;
}

const MobileHeroSection = ({ 
  onLocationDetect, 
  onSearch, 
  onToggleFilters 
}: MobileHeroSectionProps) => {
  const isMobile = useIsMobile();
  const { location, requestLocation, loading: locationLoading } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const handleLocationDetect = async () => {
    await requestLocation();
    onLocationDetect?.();
  };

  const handleSearch = () => {
    const finalLocation = location?.address || locationInput || "San Francisco, CA";
    onSearch?.(searchQuery, finalLocation);
  };

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <section className="bg-gradient-primary text-primary-foreground py-6 sticky top-16 z-40 border-b">
      <div className="container mx-auto px-4">
        {/* Location Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-glow" />
            <span className="text-sm font-medium">
              {location?.address || "San Francisco, CA"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLocationDetect}
            disabled={locationLoading}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
          >
            <Locate className={`h-4 w-4 ${locationLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Unified Search Bar */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search classifieds"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background/95 backdrop-blur-sm border-white/20 text-foreground"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleFilters}
              className="h-12 w-12 shrink-0 bg-background/95 hover:bg-background"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-primary-foreground/80">
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-white/20">
              25k+
            </Badge>
            <span>listings</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-white/20">
              500+
            </Badge>
            <span>categories</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileHeroSection;