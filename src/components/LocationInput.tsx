import { useState } from 'react';
import { MapPin, Locate, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation, useLocationSuggestions } from '@/hooks/useLocation';
import { geocodeAddress } from '@/lib/location';
import { useToast } from '@/hooks/use-toast';

interface LocationInputProps {
  value: string;
  onChange: (location: string, coords?: { latitude: number; longitude: number }) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const LocationInput = ({
  value,
  onChange,
  label = "Location",
  placeholder = "Enter your location",
  className = "",
  required = false
}: LocationInputProps) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { location, requestLocation, hasLocation } = useLocation();
  const suggestions = useLocationSuggestions();
  const { toast } = useToast();

  const handleUseCurrentLocation = async () => {
    try {
      await requestLocation(false);
      
      if (location?.address) {
        onChange(location.address, location.coords);
        toast({
          title: "Location detected",
          description: "Your current location has been set",
        });
      }
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please enable location access or enter manually",
        variant: "destructive"
      });
    }
  };

  const handleLocationChange = async (newLocation: string) => {
    onChange(newLocation);
    
    // Auto-geocode if the location looks complete
    if (newLocation.length > 10 && newLocation.includes(',')) {
      setIsGeocoding(true);
      try {
        const coords = await geocodeAddress(newLocation);
        if (coords) {
          onChange(newLocation, coords);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
      } finally {
        setIsGeocoding(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="location" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="location"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleLocationChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="pr-24"
          required={required}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {isGeocoding && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleUseCurrentLocation}
            title="Use current location"
          >
            <Locate className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Location suggestions */}
      {showSuggestions && (suggestions.length > 0 || hasLocation) && (
        <Card className="absolute z-50 w-full mt-1 p-2 shadow-lg border">
          <div className="space-y-1">
            {hasLocation && location?.address && !suggestions.includes(location.address) && (
              <div
                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => handleSuggestionClick(location.address!)}
              >
                <Locate className="h-3 w-3 text-primary" />
                <span className="text-sm">Current location</span>
                <Badge variant="secondary" className="text-xs ml-auto">
                  Detected
                </Badge>
              </div>
            )}
            
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{suggestion}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Current location indicator */}
      {hasLocation && location?.address && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Locate className="h-3 w-3" />
          <span>Current: {location.address}</span>
        </div>
      )}
    </div>
  );
};

export default LocationInput;