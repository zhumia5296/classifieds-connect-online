import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, Loader2, RefreshCw, Target, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

const InteractiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ads, setAds] = useState<AdMarker[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAlerts, setNearbyAlerts] = useState<any[]>([]);
  const [showAlertRadius, setShowAlertRadius] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  console.log('🎯 InteractiveMap component rendered');

  const fetchMapboxToken = async () => {
    try {
      console.log('🗺️ Fetching Mapbox token from edge function...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      console.log('📡 Edge function response:', { data, error });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (!data?.token) {
        console.error('❌ No token in response data:', data);
        throw new Error('No token received from edge function');
      }

      console.log('✅ Successfully fetched Mapbox token');
      return data.token;
    } catch (error) {
      console.error('💥 Failed to fetch Mapbox token:', error);
      throw error;
    }
  };

  const initializeMap = async () => {
    try {
      console.log('🚀 Starting map initialization...');
      console.log('📦 Container ref:', mapContainer.current);
      
      // Wait for container to be ready
      if (!mapContainer.current) {
        console.log('⏳ Container not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!mapContainer.current) {
          throw new Error('Map container not found after waiting');
        }
      }

      setIsLoading(true);
      setError(null);

      // Get the Mapbox token
      const token = await fetchMapboxToken();
      console.log('🔑 Got token, setting up Mapbox...');

      // Clean up existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      // Set the access token
      mapboxgl.accessToken = token;

      // Create the map
      console.log('🗺️ Creating Mapbox map...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.006, 40.7128], // NYC
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Set up event listeners
      map.current.on('load', () => {
        console.log('🎉 Map loaded successfully!');
        setIsLoading(false);
        loadAdsWithLocation();
      });

      map.current.on('error', (e) => {
        console.error('💥 Map loading error:', e);
        setError('Failed to load map. Please check your Mapbox token configuration.');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('💥 Map initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  };

  const loadAdsWithLocation = async () => {
    if (!map.current) return;
    
    setLoadingAds(true);
    try {
      console.log('📍 Loading ads with location data...');
      
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
        .not('longitude', 'is', null)
        .limit(100); // Limit for better performance

      if (error) {
        console.error('❌ Error fetching ads:', error);
        throw error;
      }

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

      console.log(`✅ Found ${formattedAds.length} ads with location data`);
      setAds(formattedAds);
      addMarkersToMap(formattedAds);
      
    } catch (error) {
      console.error('💥 Error loading ads:', error);
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

    console.log(`📌 Adding ${adsData.length} markers to map`);

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

      // Create popup
      const popupContent = `
        <div class="min-w-[200px] max-w-[300px]">
          ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.title}" class="w-full h-32 object-cover rounded mb-2" />` : ''}
          <h3 class="font-semibold text-sm mb-1 line-clamp-2">${ad.title}</h3>
          <p class="text-lg font-bold text-primary mb-1">${ad.currency} ${ad.price.toLocaleString()}</p>
          <p class="text-xs text-muted-foreground mb-2">${ad.category}</p>
          <p class="text-xs text-muted-foreground mb-3">${ad.location}</p>
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

  // Fetch user's nearby alert preferences
  const fetchNearbyAlerts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('nearby_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true);

      if (error) throw error;
      
      setNearbyAlerts(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching nearby alerts:', error);
      return [];
    }
  };

  // Add alert radius circles to map
  const addAlertRadiusCircles = (userLat: number, userLng: number, alerts: any[]) => {
    if (!map.current) return;

    // Remove existing circles
    if (map.current.getLayer('alert-radius-fill')) {
      map.current.removeLayer('alert-radius-fill');
    }
    if (map.current.getLayer('alert-radius-border')) {
      map.current.removeLayer('alert-radius-border');
    }
    if (map.current.getSource('alert-radius')) {
      map.current.removeSource('alert-radius');
    }

    // Create circles for each alert preference
    const features = alerts.map((alert, index) => {
      const radiusKm = alert.radius_km || 25;
      const center = [userLng, userLat];
      const radiusInMeters = radiusKm * 1000;
      
      // Create a circle using turf.js-like calculation
      const points = 64;
      const coords = [];
      for (let i = 0; i < points; i++) {
        const angle = (i * 360) / points;
        const dx = radiusInMeters * Math.cos(angle * Math.PI / 180);
        const dy = radiusInMeters * Math.sin(angle * Math.PI / 180);
        
        // Convert meters to degrees (approximate)
        const deltaLat = dy / 111320;
        const deltaLon = dx / (111320 * Math.cos(userLat * Math.PI / 180));
        
        coords.push([userLng + deltaLon, userLat + deltaLat]);
      }
      coords.push(coords[0]); // Close the polygon

      return {
        type: 'Feature' as const,
        properties: {
          alertIndex: index,
          radiusKm: radiusKm
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords]
        }
      };
    });

    // Add source
    map.current.addSource('alert-radius', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });

    // Add fill layer
    map.current.addLayer({
      id: 'alert-radius-fill',
      type: 'fill',
      source: 'alert-radius',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1
      }
    });

    // Add border layer
    map.current.addLayer({
      id: 'alert-radius-border',
      type: 'line',
      source: 'alert-radius',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });
  };

  const getUserLocation = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 User location:', latitude, longitude);
          
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Add user location marker
          const userMarkerEl = document.createElement('div');
          userMarkerEl.innerHTML = `
            <div class="bg-blue-500 text-white rounded-full w-4 h-4 border-2 border-white shadow-lg animate-pulse"></div>
          `;
          
          new mapboxgl.Marker(userMarkerEl)
            .setLngLat([longitude, latitude])
            .addTo(map.current!);

          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 12
          });

          // Fetch and display alert radius if enabled
          if (showAlertRadius) {
            const alerts = await fetchNearbyAlerts();
            if (alerts.length > 0) {
              addAlertRadiusCircles(latitude, longitude, alerts);
            }
          }
        },
        (error) => {
          console.error('❌ Location error:', error);
          toast({
            title: "Location Error",
            description: "Could not get your current location",
            variant: "destructive"
          });
        }
      );
    }
  };

  const toggleAlertRadius = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your alert radius",
        variant: "destructive"
      });
      return;
    }

    const newShowState = !showAlertRadius;
    setShowAlertRadius(newShowState);

    if (newShowState && userLocation) {
      const alerts = await fetchNearbyAlerts();
      if (alerts.length > 0) {
        addAlertRadiusCircles(userLocation.lat, userLocation.lng, alerts);
        toast({
          title: "Alert Radius Visible",
          description: `Showing ${alerts.length} alert zone(s)`,
        });
      } else {
        toast({
          title: "No Alert Preferences",
          description: "Set up nearby alerts in settings to see radius",
        });
      }
    } else {
      // Remove radius circles
      if (map.current) {
        if (map.current.getLayer('alert-radius-fill')) {
          map.current.removeLayer('alert-radius-fill');
        }
        if (map.current.getLayer('alert-radius-border')) {
          map.current.removeLayer('alert-radius-border');
        }
        if (map.current.getSource('alert-radius')) {
          map.current.removeSource('alert-radius');
        }
      }
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    console.log('🔄 useEffect triggered - initializing map');
    console.log('📍 Container ref current:', mapContainer.current);
    
    // Add a longer delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      console.log('⏰ Timer fired, checking container again:', mapContainer.current);
      if (mapContainer.current) {
        console.log('✅ Container found, initializing map');
        initializeMap();
      } else {
        console.log('❌ Container still not found after timeout');
        // Try again with a longer delay
        setTimeout(() => {
          console.log('🔄 Retrying after longer delay:', mapContainer.current);
          if (mapContainer.current) {
            initializeMap();
          }
        }, 1000);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        console.log('🧹 Cleaning up map');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 rounded-lg p-8">
        <MapPin className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Map Error</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          {error}
        </p>
        <Button 
          onClick={() => {
            setError(null);
            setIsLoading(true);
            initializeMap();
          }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container - Always rendered */}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 rounded-lg p-8 z-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
          <p className="text-sm text-muted-foreground">Initializing Mapbox and fetching listings</p>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={getUserLocation}
          className="shadow-md"
          disabled={isLoading}
        >
          <Navigation className="h-4 w-4 mr-2" />
          My Location
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleAlertRadius}
          className="shadow-md"
          disabled={isLoading}
        >
          {showAlertRadius ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showAlertRadius ? 'Hide' : 'Show'} Alert Radius
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadAdsWithLocation}
          disabled={loadingAds || isLoading}
          className="shadow-md"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingAds ? 'animate-spin' : ''}`} />
          {loadingAds ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <p className="text-sm font-medium">
          {ads.length} items on map
        </p>
      </div>
    </div>
  );
};

export default InteractiveMap;