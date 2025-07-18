import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation } from 'lucide-react';

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
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [ads, setAds] = useState<AdMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 10,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapReady(true);
      fetchAdsWithLocation();
    });
  };

  const fetchAdsWithLocation = async () => {
    if (!map.current) return;
    
    setLoading(true);
    try {
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

      setAds(formattedAds);
      addMarkersToMap(formattedAds);
    } catch (err) {
      console.error('Error fetching ads:', err);
      toast({
        title: "Error",
        description: "Failed to load items on map",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addMarkersToMap = (adsData: AdMarker[]) => {
    if (!map.current) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    adsData.forEach(ad => {
      // Create marker element
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

      // Create popup content
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

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken.trim());
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

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isMapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Map Configuration Required</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          To display the map, please enter your Mapbox public token. You can get one at{' '}
          <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            mapbox.com
          </a>
        </p>
        <form onSubmit={handleTokenSubmit} className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="Enter Mapbox public token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!mapboxToken.trim()}>
            Load Map
          </Button>
        </form>
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
          disabled={loading}
          className="shadow-md"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh'}
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