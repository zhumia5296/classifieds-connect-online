import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface AdMarker {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  image_url?: string;
}

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [ads, setAds] = useState<AdMarker[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMapboxToken = async () => {
    console.log('🗺️ Fetching Mapbox token...');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.error('❌ Token fetch error:', error);
      throw error;
    }

    if (!data?.token) {
      console.error('❌ No token in response');
      throw new Error('No token received');
    }

    console.log('✅ Token fetched successfully');
    return data.token;
  };

  const initializeMap = async () => {
    console.log('🚀 Starting map initialization...');
    
    if (!mapContainer.current) {
      console.error('❌ No container element');
      setError('Map container not found');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get token
      const token = await fetchMapboxToken();
      console.log('🔑 Got token, setting up map...');

      // Clean up any existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      // Set Mapbox token
      mapboxgl.accessToken = token;

      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.006, 40.7128],
        zoom: 10,
      });

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Set up event handlers
      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setIsMapReady(true);
        setIsLoading(false);
        fetchAdsWithLocation();
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const fetchAdsWithLocation = async () => {
    if (!map.current) return;
    
    setLoadingAds(true);
    try {
      console.log('📍 Fetching ads with location...');
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          price,
          currency,
          location,
          latitude,
          longitude,
          categories!inner(name),
          ad_images!left(image_url)
        `)
        .eq('is_active', true)
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const formattedAds: AdMarker[] = (data || []).map(ad => ({
        id: ad.id,
        title: ad.title,
        price: ad.price || 0,
        currency: ad.currency || 'USD',
        location: ad.location || '',
        latitude: parseFloat(String(ad.latitude)),
        longitude: parseFloat(String(ad.longitude)),
        category: ad.categories?.name || 'Other',
        image_url: ad.ad_images?.[0]?.image_url
      }));

      console.log(`✅ Found ${formattedAds.length} ads with location`);
      setAds(formattedAds);
      addMarkersToMap(formattedAds);
    } catch (err) {
      console.error('❌ Error fetching ads:', err);
      toast({
        title: "Error",
        description: "Failed to load items on map",
        variant: "destructive"
      });
    } finally {
      setLoadingAds(false);
    }
  };

  const addMarkersToMap = (adsData: AdMarker[]) => {
    if (!map.current) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    adsData.forEach(ad => {
      const markerEl = document.createElement('div');
      markerEl.className = 'mapbox-marker';
      markerEl.innerHTML = `
        <div class="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor"/>
            <circle cx="12" cy="10" r="3" fill="white"/>
          </svg>
        </div>
      `;

      const popupContent = `
        <div class="min-w-[200px] max-w-[300px]">
          ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.title}" class="w-full h-32 object-cover rounded mb-2" />` : ''}
          <h3 class="font-semibold text-sm mb-1 line-clamp-2">${ad.title}</h3>
          <p class="text-lg font-bold text-primary mb-1">${ad.currency} ${ad.price.toLocaleString()}</p>
          <p class="text-xs text-muted-foreground mb-2">${ad.category}</p>
          <p class="text-xs text-muted-foreground mb-3 flex items-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${ad.location}
          </p>
          <a href="/ad/${ad.id}" class="inline-block w-full text-center bg-primary text-primary-foreground px-3 py-1 rounded text-xs hover:bg-primary/90 transition-colors">
            View Details
          </a>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      new mapboxgl.Marker(markerEl)
        .setLngLat([ad.longitude, ad.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit map to show all markers
    if (adsData.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      adsData.forEach(ad => {
        bounds.extend([ad.longitude, ad.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 12
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Could not get your current location",
            variant: "destructive"
          });
        }
      );
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    console.log('🎯 Map component mounted');
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Map Error</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          {error}
        </p>
        <Button onClick={() => {
          setError(null);
          initializeMap();
        }}>
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
        <p className="text-sm text-muted-foreground">Please wait while we initialize the map</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={getUserLocation}
          className="shadow-md"
        >
          <Navigation className="h-4 w-4 mr-2" />
          My Location
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAdsWithLocation}
          disabled={loadingAds}
          className="shadow-md"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {loadingAds ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <p className="text-sm font-medium">
          {ads.length} items shown on map
        </p>
      </div>
    </div>
  );
};

export default Map;