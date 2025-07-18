import { useState } from 'react';
import { MapPin, Navigation, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLocation, useNearbyAds } from '@/hooks/useLocation';
import { formatDistance } from '@/lib/location';
import { useNavigate } from 'react-router-dom';
import LocationRadiusControl from './LocationRadiusControl';

interface LocationBasedSuggestionsProps {
  maxSuggestions?: number;
  radiusKm?: number;
  className?: string;
}

const LocationBasedSuggestions = ({ 
  maxSuggestions = 6, 
  radiusKm = 25,
  className = ""
}: LocationBasedSuggestionsProps) => {
  const navigate = useNavigate();
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [showRadiusControls, setShowRadiusControls] = useState(false);
  const { location, loading: locationLoading, requestLocation, hasLocation } = useLocation();
  const { nearbyAds, loading: adsLoading, currentRadius, updateRadius } = useNearbyAds(radiusKm, maxSuggestions);

  const handleEnableLocation = async () => {
    await requestLocation(true);
  };

  const handleDismiss = () => {
    setShowLocationPrompt(false);
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Contact for price';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  // Don't show anything if user dismissed the prompt and has no location
  if (!showLocationPrompt && !hasLocation) {
    return null;
  }

  // Show location prompt if user hasn't enabled location
  if (!hasLocation && showLocationPrompt) {
    return (
      <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Find Nearby Deals
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Enable location access to discover great deals near you and get personalized recommendations.
          </p>
          <Button 
            onClick={handleEnableLocation}
            disabled={locationLoading}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {locationLoading ? 'Getting Location...' : 'Enable Location'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (adsLoading && hasLocation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Nearby Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show nearby ads if we have them
  if (hasLocation && nearbyAds.length > 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Nearby Deals</span>
              {location?.address && (
                <Badge variant="secondary" className="text-xs">
                  {location.address.split(',')[0]}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {currentRadius}km
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setShowRadiusControls(!showRadiusControls)}
              title="Adjust search radius"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Radius Controls */}
          <Collapsible open={showRadiusControls} onOpenChange={setShowRadiusControls}>
            <CollapsibleContent>
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <LocationRadiusControl
                  radius={currentRadius}
                  onRadiusChange={updateRadius}
                  showPresets={true}
                  showCustomInput={false}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-3">
            {nearbyAds.slice(0, maxSuggestions).map((ad) => (
              <div
                key={ad.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/ad/${ad.id}`)}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={ad.image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=100&h=100&fit=crop"}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm truncate">
                      {ad.title}
                    </h3>
                    {ad.is_featured && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatPrice(ad.price, ad.currency)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {ad.category_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistance(ad.distance_km)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {nearbyAds.length > maxSuggestions && (
              <Button 
                variant="ghost" 
                className="w-full text-sm"
                onClick={() => navigate(`/?location=nearby`)}
              >
                View all {nearbyAds.length} nearby ads
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if location is enabled but no nearby ads
  if (hasLocation && nearbyAds.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Nearby Deals</span>
              {location?.address && (
                <Badge variant="secondary" className="text-xs">
                  {location.address.split(',')[0]}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {currentRadius}km
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setShowRadiusControls(!showRadiusControls)}
              title="Adjust search radius"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Radius Controls */}
          <Collapsible open={showRadiusControls} onOpenChange={setShowRadiusControls}>
            <CollapsibleContent>
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <LocationRadiusControl
                  radius={currentRadius}
                  onRadiusChange={updateRadius}
                  showPresets={true}
                  showCustomInput={false}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="text-center py-4">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No ads found within {currentRadius}km of your location.
            </p>
            <div className="flex flex-col gap-2 mt-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowRadiusControls(!showRadiusControls)}
              >
                Expand search radius
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/post-ad')}
              >
                Be the first to post in your area
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default LocationBasedSuggestions;