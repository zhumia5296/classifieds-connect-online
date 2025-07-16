import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Layers, Filter, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Ad = Tables<'ads'> & {
  ad_images?: Tables<'ad_images'>[];
  categories?: Tables<'categories'>;
};

interface MapViewProps {
  searchTerm?: string;
  selectedCategory?: string;
  priceRange?: { min: string; max: string };
  initialCenter?: [number, number];
  initialZoom?: number;
}

const MapView = ({ 
  searchTerm = '',
  selectedCategory = '',
  priceRange = { min: '', max: '' },
  initialCenter = [-73.935242, 40.730610], // Default to NYC
  initialZoom = 10
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get Mapbox token from environment or prompt user
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        // Try to get token from Supabase Edge Function secrets
        const response = await fetch(`https://lvvtlseiwrnrvrmenche.supabase.co/functions/v1/get-mapbox-token`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnRsc2Vpd3JucnZybWVuY2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjQzNjEsImV4cCI6MjA2Nzk0MDM2MX0.gORqMiQAA66-qgrOJZXQ5hzQ0505Tmrm4LEsT7_DRbc'}`
          }
        });
        
        if (response.ok) {
          const { token } = await response.json();
          setMapboxToken(token);
        } else {
          setShowTokenInput(true);
        }
      } catch (error) {
        console.log('Could not fetch Mapbox token from server, showing input');
        setShowTokenInput(true);
      }
    };

    getMapboxToken();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Fetch ads with location data
  const fetchAds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ads')
        .select(`
          *,
          ad_images(*),
          categories(*)
        `)
        .eq('is_active', true)
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (priceRange.min) {
        query = query.gte('price', parseFloat(priceRange.min));
      }
      if (priceRange.max) {
        query = query.lte('price', parseFloat(priceRange.max));
      }

      const { data, error } = await query.limit(500); // Limit for performance

      if (error) throw error;

      setAds(data as Ad[] || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Error",
        description: "Failed to load ads for map view.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [searchTerm, selectedCategory, priceRange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: userLocation || initialCenter,
      zoom: initialZoom,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    
    map.current.addControl(geolocate, 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation, initialCenter, initialZoom]);

  // Update markers when ads change
  useEffect(() => {
    if (!map.current || !ads.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each ad
    ads.forEach(ad => {
      if (!ad.latitude || !ad.longitude) return;

      const primaryImage = ad.ad_images?.find(img => img.is_primary) || ad.ad_images?.[0];
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        background: ${ad.is_featured ? '#ff6b35' : '#3b82f6'};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;
      
      // Add price to marker if available
      if (ad.price) {
        markerEl.textContent = `$${ad.price}`;
      } else {
        markerEl.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/><circle cx="8" cy="6" r="2"/></svg>';
      }

      // Add hover effect
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.1)';
      });
      
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([ad.longitude, ad.latitude])
        .addTo(map.current!);

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'ad-popup';
      popupContent.innerHTML = `
        <div style="max-width: 300px;">
          ${primaryImage ? `<img src="${primaryImage.image_url}" alt="${ad.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;">` : ''}
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #1f2937;">${ad.title}</h3>
          <p style="font-size: 18px; font-weight: 700; color: #059669; margin: 0 0 4px 0;">
            ${ad.price ? `${ad.currency || 'USD'} $${ad.price}` : 'Price not specified'}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0; display: flex; align-items: center;">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 4px;">
              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
              <circle cx="8" cy="6" r="2"/>
            </svg>
            ${ad.location || 'Location not specified'}
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px 0;">
            ${ad.categories?.name || 'Uncategorized'} • ${new Date(ad.created_at).toLocaleDateString()}
          </p>
          <button 
            onclick="window.open('/ad/${ad.id}', '_blank')" 
            style="width: 100%; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s;"
            onmouseover="this.style.background='#2563eb'"
            onmouseout="this.style.background='#3b82f6'"
          >
            View Details
          </button>
        </div>
      `;

      // Add click event to marker
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        // Create and show new popup
        popupRef.current = new mapboxgl.Popup({
          closeOnClick: true,
          closeButton: true,
          offset: 25,
          className: 'custom-popup'
        })
        .setLngLat([ad.longitude!, ad.latitude!])
        .setDOMContent(popupContent)
        .addTo(map.current!);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (ads.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      ads.forEach(ad => {
        if (ad.latitude && ad.longitude) {
          bounds.extend([ad.longitude, ad.latitude]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }

  }, [ads]);

  // Handle token input
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const token = formData.get('token') as string;
    
    if (token) {
      setMapboxToken(token);
      setShowTokenInput(false);
      toast({
        title: "Success",
        description: "Mapbox token configured successfully!"
      });
    }
  };

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
              <p className="text-sm text-muted-foreground">
                Please enter your Mapbox public token to enable the map view.
                Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
              </p>
            </div>
            
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <Input
                name="token"
                placeholder="Enter Mapbox public token..."
                required
              />
              <Button type="submit" className="w-full">
                Configure Map
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading ads...</p>
          </div>
        </div>
      )}
      
      {/* Map Stats */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{ads.length}</span>
          <span className="text-muted-foreground">ads shown</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
            <span>Regular ads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
            <span>Featured ads</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;