import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Truck, Package, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrackingData {
  id: string;
  delivery_request_id: string;
  provider_id: string;
  latitude: number;
  longitude: number;
  status: string;
  activity_type?: string;
  speed_kmh?: number;
  heading_degrees?: number;
  tracked_at: string;
  delivery_request?: {
    pickup_latitude: number;
    pickup_longitude: number;
    delivery_latitude: number;
    delivery_longitude: number;
    pickup_address: string;
    delivery_address: string;
    status: string;
  };
  provider?: {
    business_name: string;
    vehicle_types: string[];
  };
}

interface DeliveryProvider {
  id: string;
  business_name: string;
  current_latitude?: number;
  current_longitude?: number;
  is_available: boolean;
  vehicle_types: string[];
  rating: number;
}

interface InteractiveTrackingMapProps {
  deliveryRequestId?: string;
  showAllProviders?: boolean;
  height?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export const InteractiveTrackingMap: React.FC<InteractiveTrackingMapProps> = ({
  deliveryRequestId,
  showAllProviders = false,
  height = '500px',
  onLocationSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<TrackingData | null>(null);
  const { toast } = useToast();

  // Markers storage
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    initializeMap();
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (map.current) {
      fetchTrackingData();
      if (showAllProviders) {
        fetchProviders();
      }
      
      // Set up real-time subscriptions
      const trackingChannel = supabase
        .channel('delivery-tracking')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'delivery_tracking'
        }, handleTrackingUpdate)
        .subscribe();

      const providersChannel = supabase
        .channel('delivery-providers')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_providers'
        }, handleProviderUpdate)
        .subscribe();

      // Refresh data every 30 seconds
      const interval = setInterval(fetchTrackingData, 30000);

      return () => {
        supabase.removeChannel(trackingChannel);
        supabase.removeChannel(providersChannel);
        clearInterval(interval);
      };
    }
  }, [map.current, deliveryRequestId, showAllProviders]);

  const initializeMap = async () => {
    try {
      // Get Mapbox token from edge function
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      
      if (!tokenData?.token) {
        throw new Error('Mapbox token not available');
      }

      mapboxgl.accessToken = tokenData.token;

      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.006, 40.7128], // Default to NYC
        zoom: 12,
        pitch: 45,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      }), 'top-right');

      map.current.on('load', () => {
        setLoading(false);
        setupMapSources();
      });

      // Handle location selection
      if (onLocationSelect) {
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          onLocationSelect(lat, lng);
        });
      }

    } catch (error) {
      console.error('Failed to initialize map:', error);
      toast({
        title: "Map Error",
        description: "Failed to load the map. Please check your internet connection.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const setupMapSources = () => {
    if (!map.current) return;

    // Add route source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    // Add route layer
    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });
  };

  const fetchTrackingData = async () => {
    try {
      let query = supabase
        .from('delivery_tracking')
        .select(`
          *,
          delivery_request:delivery_requests(
            pickup_latitude,
            pickup_longitude,
            delivery_latitude,
            delivery_longitude,
            pickup_address,
            delivery_address,
            status
          ),
          provider:delivery_providers(
            business_name,
            vehicle_types
          )
        `)
        .order('tracked_at', { ascending: false });

      if (deliveryRequestId) {
        query = query.eq('delivery_request_id', deliveryRequestId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTrackingData(data || []);
      updateMapMarkers(data || []);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_providers')
        .select('*')
        .eq('is_active', true)
        .not('current_latitude', 'is', null)
        .not('current_longitude', 'is', null);

      if (error) throw error;
      
      setProviders(data || []);
      updateProviderMarkers(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const updateMapMarkers = (data: TrackingData[]) => {
    if (!map.current) return;

    // Clear existing delivery markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('delivery-')) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    // Group by delivery request to get latest position
    const latestPositions = new Map<string, TrackingData>();
    data.forEach(track => {
      const existing = latestPositions.get(track.delivery_request_id);
      if (!existing || new Date(track.tracked_at) > new Date(existing.tracked_at)) {
        latestPositions.set(track.delivery_request_id, track);
      }
    });

    // Add delivery markers
    latestPositions.forEach(track => {
      if (track.delivery_request) {
        // Pickup marker
        const pickupEl = createMarkerElement('pickup', track.delivery_request.status);
        const pickupMarker = new mapboxgl.Marker(pickupEl)
          .setLngLat([track.delivery_request.pickup_longitude, track.delivery_request.pickup_latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">Pickup Location</h3>
              <p class="text-sm">${track.delivery_request.pickup_address}</p>
              <p class="text-xs text-muted-foreground">Status: ${track.delivery_request.status}</p>
            </div>
          `))
          .addTo(map.current!);
        
        markersRef.current[`delivery-pickup-${track.delivery_request_id}`] = pickupMarker;

        // Delivery marker
        const deliveryEl = createMarkerElement('delivery', track.delivery_request.status);
        const deliveryMarker = new mapboxgl.Marker(deliveryEl)
          .setLngLat([track.delivery_request.delivery_longitude, track.delivery_request.delivery_latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">Delivery Location</h3>
              <p class="text-sm">${track.delivery_request.delivery_address}</p>
              <p class="text-xs text-muted-foreground">Status: ${track.delivery_request.status}</p>
            </div>
          `))
          .addTo(map.current!);
        
        markersRef.current[`delivery-delivery-${track.delivery_request_id}`] = deliveryMarker;

        // Current position marker (moving delivery person)
        const currentEl = createMarkerElement('current', track.status, track.activity_type);
        const currentMarker = new mapboxgl.Marker(currentEl)
          .setLngLat([track.longitude, track.latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${track.provider?.business_name || 'Delivery Provider'}</h3>
              <p class="text-sm">Status: ${track.status}</p>
              ${track.activity_type ? `<p class="text-xs">Activity: ${track.activity_type}</p>` : ''}
              ${track.speed_kmh ? `<p class="text-xs">Speed: ${track.speed_kmh} km/h</p>` : ''}
              <p class="text-xs text-muted-foreground">Updated: ${new Date(track.tracked_at).toLocaleTimeString()}</p>
            </div>
          `))
          .addTo(map.current!);
        
        markersRef.current[`delivery-current-${track.delivery_request_id}`] = currentMarker;

        // Fit map to show all markers if this is the selected delivery
        if (deliveryRequestId === track.delivery_request_id) {
          const bounds = new mapboxgl.LngLatBounds()
            .extend([track.delivery_request.pickup_longitude, track.delivery_request.pickup_latitude])
            .extend([track.delivery_request.delivery_longitude, track.delivery_request.delivery_latitude])
            .extend([track.longitude, track.latitude]);
          
          map.current!.fitBounds(bounds, { padding: 50 });
        }
      }
    });
  };

  const updateProviderMarkers = (data: DeliveryProvider[]) => {
    if (!map.current) return;

    // Clear existing provider markers
    Object.keys(markersRef.current).forEach(key => {
      if (key.startsWith('provider-')) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    // Add provider markers
    data.forEach(provider => {
      if (provider.current_latitude && provider.current_longitude) {
        const el = createMarkerElement('provider', provider.is_available ? 'available' : 'busy');
        const marker = new mapboxgl.Marker(el)
          .setLngLat([provider.current_longitude, provider.current_latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${provider.business_name}</h3>
              <p class="text-sm">Rating: ${'⭐'.repeat(Math.round(provider.rating))}</p>
              <p class="text-xs">Vehicles: ${provider.vehicle_types.join(', ')}</p>
              <p class="text-xs ${provider.is_available ? 'text-green-600' : 'text-yellow-600'}">
                ${provider.is_available ? 'Available' : 'Busy'}
              </p>
            </div>
          `))
          .addTo(map.current!);
        
        markersRef.current[`provider-${provider.id}`] = marker;
      }
    });
  };

  const createMarkerElement = (type: string, status: string, activity?: string) => {
    const el = document.createElement('div');
    el.className = 'marker-container';
    
    let icon, color, bgColor;
    
    switch (type) {
      case 'pickup':
        icon = '📦';
        color = status === 'picked_up' ? 'text-green-600' : 'text-blue-600';
        bgColor = status === 'picked_up' ? 'bg-green-100' : 'bg-blue-100';
        break;
      case 'delivery':
        icon = '🏠';
        color = status === 'delivered' ? 'text-green-600' : 'text-purple-600';
        bgColor = status === 'delivered' ? 'bg-green-100' : 'bg-purple-100';
        break;
      case 'current':
        icon = activity === 'driving' ? '🚗' : activity === 'walking' ? '🚶' : '📍';
        color = 'text-red-600';
        bgColor = 'bg-red-100';
        break;
      case 'provider':
        icon = '🚚';
        color = status === 'available' ? 'text-green-600' : 'text-yellow-600';
        bgColor = status === 'available' ? 'bg-green-100' : 'bg-yellow-100';
        break;
      default:
        icon = '📍';
        color = 'text-gray-600';
        bgColor = 'bg-gray-100';
    }
    
    el.innerHTML = `
      <div class="w-8 h-8 rounded-full ${bgColor} ${color} flex items-center justify-center text-lg border-2 border-white shadow-lg">
        ${icon}
      </div>
    `;
    
    return el;
  };

  const handleTrackingUpdate = (payload: any) => {
    console.log('Real-time tracking update:', payload);
    fetchTrackingData();
  };

  const handleProviderUpdate = (payload: any) => {
    console.log('Real-time provider update:', payload);
    if (showAllProviders) {
      fetchProviders();
    }
  };

  const centerOnDelivery = (track: TrackingData) => {
    if (!map.current || !track.delivery_request) return;

    const bounds = new mapboxgl.LngLatBounds()
      .extend([track.delivery_request.pickup_longitude, track.delivery_request.pickup_latitude])
      .extend([track.delivery_request.delivery_longitude, track.delivery_request.delivery_latitude])
      .extend([track.longitude, track.latitude]);
    
    map.current.fitBounds(bounds, { padding: 50 });
    setSelectedDelivery(track);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading map...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div ref={mapContainer} style={{ height }} className="w-full" />
      </Card>

      {/* Active Deliveries Panel */}
      {trackingData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Active Deliveries
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Array.from(new Map(trackingData.map(track => [track.delivery_request_id, track])).values()).map(track => (
              <div 
                key={track.delivery_request_id}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  selectedDelivery?.delivery_request_id === track.delivery_request_id 
                    ? 'bg-primary/10 border-primary' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => centerOnDelivery(track)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">{track.provider?.business_name || 'Unknown Provider'}</span>
                  </div>
                  <Badge variant={track.status === 'delivered' ? 'default' : 'secondary'}>
                    {track.status}
                  </Badge>
                </div>
                {track.delivery_request && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {track.delivery_request.pickup_address} → {track.delivery_request.delivery_address}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Last update: {new Date(track.tracked_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Map Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Map Legend</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span>Pickup Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span>Delivery Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>Current Position</span>
          </div>
          {showAllProviders && (
            <div className="flex items-center gap-2">
              <span>🚚</span>
              <span>Available Providers</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InteractiveTrackingMap;