import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getCurrentLocation, 
  getLocationWithCache, 
  type LocationInfo, 
  type NearbyAd 
} from '@/lib/location';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requestLocation = async (showToast = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const userLocation = await getLocationWithCache();
      setLocation(userLocation);
      
      if (showToast) {
        toast({
          title: "Location detected",
          description: userLocation.address || "Your location has been detected",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      
      if (showToast) {
        toast({
          title: "Location access denied",
          description: "Enable location access to see nearby ads",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
    localStorage.removeItem('user_location');
  };

  return {
    location,
    loading,
    error,
    requestLocation,
    clearLocation,
    hasLocation: !!location
  };
};

export const useNearbyAds = (radiusKm: number = 50, limit: number = 20) => {
  const [nearbyAds, setNearbyAds] = useState<NearbyAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  const fetchNearbyAds = async () => {
    if (!location?.coords) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_nearby_ads', {
        user_lat: location.coords.latitude,
        user_lng: location.coords.longitude,
        radius_km: radiusKm,
        limit_count: limit
      });

      if (fetchError) throw fetchError;

      setNearbyAds(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch nearby ads';
      setError(message);
      console.error('Error fetching nearby ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location?.coords) {
      fetchNearbyAds();
    }
  }, [location, radiusKm, limit]);

  return {
    nearbyAds,
    loading,
    error,
    refetch: fetchNearbyAds,
    hasLocation: !!location?.coords
  };
};

// Hook for getting location suggestions based on user's area
export const useLocationSuggestions = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { location } = useLocation();

  useEffect(() => {
    if (location?.address) {
      // Extract city/area from the address and create suggestions
      const addressParts = location.address.split(', ');
      const citySuggestions = [
        location.address,
        addressParts[0], // First part (usually neighborhood/area)
        addressParts.slice(0, 2).join(', '), // First two parts
        addressParts.slice(-2).join(', ') // Last two parts (usually city, state/country)
      ].filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
      
      setSuggestions(citySuggestions);
    }
  }, [location]);

  return suggestions;
};