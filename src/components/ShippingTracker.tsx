import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useShipping, TrackingInfo, TrackingEvent } from '@/hooks/useShipping';
import { 
  Package, 
  Truck, 
  Search, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ShippingTrackerProps {
  trackingNumber?: string;
  autoTrack?: boolean;
}

export const ShippingTracker: React.FC<ShippingTrackerProps> = ({
  trackingNumber: initialTrackingNumber = '',
  autoTrack = false
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { trackShipment } = useShipping();

  const handleTrack = async () => {
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const info = await trackShipment(trackingNumber.trim());
      setTrackingInfo(info);
    } catch (err) {
      setError('Failed to track shipment. Please check the tracking number and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoTrack && initialTrackingNumber) {
      handleTrack();
    }
  }, [autoTrack, initialTrackingNumber]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'in_transit':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'shipped':
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'out_for_delivery':
        return 'default';
      case 'in_transit':
        return 'secondary';
      case 'shipped':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getEventIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'in_transit':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'shipped':
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Track Your Shipment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Form */}
        <div className="flex gap-2">
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            className="flex-1"
          />
          <Button 
            onClick={handleTrack}
            disabled={loading || !trackingNumber.trim()}
          >
            <Search className="h-4 w-4 mr-2" />
            Track
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Tracking your shipment...</p>
          </div>
        )}

        {/* Tracking Results */}
        {trackingInfo && !loading && (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(trackingInfo.status)}
                  <span className="font-medium capitalize">
                    {trackingInfo.status.replace('_', ' ')}
                  </span>
                </div>
                <Badge variant={getStatusColor(trackingInfo.status)}>
                  {trackingInfo.carrier}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Tracking Number: {trackingInfo.trackingNumber}
              </p>
              {trackingInfo.estimatedDelivery && (
                <p className="text-sm text-muted-foreground">
                  Estimated Delivery: {format(new Date(trackingInfo.estimatedDelivery), 'MMM dd, yyyy')}
                </p>
              )}
              {trackingInfo.actualDelivery && (
                <p className="text-sm text-green-600">
                  Delivered: {format(new Date(trackingInfo.actualDelivery), 'MMM dd, yyyy at HH:mm')}
                </p>
              )}
            </div>

            <Separator />

            {/* Tracking Events */}
            <div className="space-y-4">
              <h3 className="font-semibold">Tracking History</h3>
              <div className="space-y-3">
                {trackingInfo.events.map((event: TrackingEvent, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className="mt-1">
                      {getEventIcon(event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium capitalize">
                          {event.status.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      {event.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};