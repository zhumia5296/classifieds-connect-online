import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from './useLocation';
import { calculateDistance } from '@/lib/location';

export interface SafeMeetupSpot {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  operating_hours?: any;
  has_cameras: boolean | null;
  has_security: boolean | null;
  is_24_7: boolean | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  distance_km?: number;
}

export const useSafeMeetupSpots = (radiusKm: number = 25, walkingOnly: boolean = false) => {
  const [spots, setSpots] = useState<SafeMeetupSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  // Walking distance is approximately 1km for 10-12 minutes of walk
  const effectiveRadius = walkingOnly ? Math.min(radiusKm, 1.0) : radiusKm;

  const fetchNearbySpots = async () => {
    if (!location?.coords) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('safe_meetup_spots')
        .select('*')
        .eq('is_active', true)
        .eq('verification_status', 'verified');

      if (fetchError) throw fetchError;

      // Calculate distances and filter by radius
      const spotsWithDistance = data
        ?.map(spot => ({
          ...spot,
          distance_km: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            spot.latitude,
            spot.longitude
          )
        }))
        .filter(spot => spot.distance_km <= effectiveRadius)
        .sort((a, b) => a.distance_km - b.distance_km) || [];

      setSpots(spotsWithDistance);
    } catch (err) {
      console.error('Error fetching safe meetup spots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch safe meetup spots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbySpots();
  }, [location?.coords, effectiveRadius]);

  return {
    spots,
    loading,
    error,
    refetch: fetchNearbySpots,
    hasLocation: !!location?.coords,
    isWalkingMode: walkingOnly,
    effectiveRadius
  };
};