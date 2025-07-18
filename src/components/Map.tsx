import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Navigation, Loader2, ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapProps {
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  showControls?: boolean;
  showUserLocation?: boolean;
  onLocationChange?: (lng: number, lat: number) => void;
}

const Map: React.FC<MapProps> = ({
  height = 'h-96',
  initialCenter = [-74.5, 40],
  initialZoom = 9,
  showControls = true,
  showUserLocation = true,
  onLocationChange
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');
  const { toast } = useToast();

  const mapStyles = [
    { name: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
    { name: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' },
    { name: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
    { name: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { name: 'Outdoors', style: 'mapbox://styles/mapbox/outdoors-v12' }
  ];

  // Fetch Mapbox token
  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) throw error;
      
      if (data?.token) {
        return data.token;
      } else {
        throw new Error('No Mapbox token received');
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
      throw new Error('Failed to get Mapbox token. Please check your configuration.');
    }
  };

  // Initialize map
  const initializeMap = async () => {
    if (!mapContainer.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = await fetchMapboxToken();
      mapboxgl.accessToken = token;

      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: initialCenter,
        zoom: initialZoom,
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

      // Set up event listeners
      map.current.on('load', () => {
        console.log('🎉 Map loaded successfully!');
        setIsLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('💥 Map loading error:', e);
        setError('Failed to load map. Please check your configuration.');
        setIsLoading(false);
      });

      // Track location changes
      if (onLocationChange) {
        map.current.on('moveend', () => {
          if (map.current) {
            const center = map.current.getCenter();
            onLocationChange(center.lng, center.lat);
          }
        });
      }

    } catch (error) {
      console.error('💥 Map initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
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
            zoom: 15
          });

          toast({
            title: "Location Found",
            description: "Centered map on your location",
          });
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

  // Change map style
  const changeMapStyle = (newStyle: string) => {
    if (map.current) {
      map.current.setStyle(newStyle);
      setMapStyle(newStyle);
    }
  };

  // Zoom controls
  const zoomIn = () => map.current?.zoomIn();
  const zoomOut = () => map.current?.zoomOut();
  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: initialCenter,
        zoom: initialZoom,
        pitch: 0,
        bearing: 0
      });
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapContainer.current) {
        initializeMap();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center ${height} bg-muted/30 rounded-lg p-8`}>
        <div className="text-destructive mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Map Error</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          {error}
        </p>
        <Button onClick={initializeMap} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${height} w-full`}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 rounded-lg p-8 z-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
          <p className="text-sm text-muted-foreground">Initializing map...</p>
        </div>
      )}

      {/* Controls */}
      {showControls && !isLoading && (
        <>
          {/* Main Controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {showUserLocation && (
              <Button
                variant="secondary"
                size="sm"
                onClick={getUserLocation}
                className="shadow-md"
              >
                <Navigation className="h-4 w-4 mr-2" />
                My Location
              </Button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-20 z-10 flex flex-col gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={zoomIn}
              className="shadow-md p-2"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={zoomOut}
              className="shadow-md p-2"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={resetView}
              className="shadow-md p-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Style Selector */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-medium">Map Style</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {mapStyles.map((style) => (
                  <Button
                    key={style.style}
                    variant={mapStyle === style.style ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeMapStyle(style.style)}
                    className="text-xs"
                  >
                    {style.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Map;