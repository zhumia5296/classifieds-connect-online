import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, ExternalLink, Shield, Camera, Clock, Star } from 'lucide-react';
import { useSafeMeetupSpots, SafeMeetupSpot } from '@/hooks/useSafeMeetupSpots';
import { formatDistance } from '@/lib/location';
import { Skeleton } from '@/components/ui/skeleton';

const getSpotTypeIcon = (type: string) => {
  switch (type) {
    case 'police_station':
      return <Shield className="h-4 w-4" />;
    case 'business':
      return <Star className="h-4 w-4" />;
    case 'public_facility':
      return <MapPin className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
};

const getSpotTypeLabel = (type: string) => {
  switch (type) {
    case 'police_station':
      return 'Police Station';
    case 'business':
      return 'Safe Business';
    case 'public_facility':
      return 'Public Facility';
    default:
      return 'Safe Location';
  }
};

const getSpotTypeColor = (type: string) => {
  switch (type) {
    case 'police_station':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
    case 'business':
      return 'bg-green-500/10 text-green-700 dark:text-green-300';
    case 'public_facility':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  }
};

interface SafetyFeatureProps {
  icon: React.ReactNode;
  label: string;
  available: boolean;
}

const SafetyFeature: React.FC<SafetyFeatureProps> = ({ icon, label, available }) => (
  <div className={`flex items-center gap-2 text-sm ${available ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
    {icon}
    <span className={available ? '' : 'line-through'}>{label}</span>
  </div>
);

interface SpotCardProps {
  spot: SafeMeetupSpot;
}

const SpotCard: React.FC<SpotCardProps> = ({ spot }) => {
  const openDirections = () => {
    const query = encodeURIComponent(spot.address);
    const url = `https://maps.google.com/maps?q=${query}`;
    window.open(url, '_blank');
  };

  const callSpot = () => {
    if (spot.contact_phone) {
      window.location.href = `tel:${spot.contact_phone}`;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className={getSpotTypeColor(spot.type)}>
            {getSpotTypeIcon(spot.type)}
            <span className="ml-1">{getSpotTypeLabel(spot.type)}</span>
          </Badge>
          {spot.distance_km && (
            <span className="text-sm text-muted-foreground">
              {formatDistance(spot.distance_km)}
            </span>
          )}
        </div>
        <CardTitle className="text-lg">{spot.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {spot.address}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {spot.description && (
          <p className="text-sm text-muted-foreground">{spot.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <SafetyFeature
            icon={<Camera className="h-4 w-4" />}
            label="Security Cameras"
            available={spot.has_cameras || false}
          />
          <SafetyFeature
            icon={<Shield className="h-4 w-4" />}
            label="Security Personnel"
            available={spot.has_security || false}
          />
          <SafetyFeature
            icon={<Clock className="h-4 w-4" />}
            label="24/7 Available"
            available={spot.is_24_7 || false}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={openDirections} className="flex-1" size="sm">
            <MapPin className="h-4 w-4 mr-1" />
            Directions
          </Button>
          
          {spot.contact_phone && (
            <Button onClick={callSpot} variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          )}
          
          {spot.website_url && (
            <Button 
              onClick={() => window.open(spot.website_url, '_blank')}
              variant="outline" 
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface SafeMeetupSpotsProps {
  radiusKm?: number;
}

const SafeMeetupSpots: React.FC<SafeMeetupSpotsProps> = ({ radiusKm = 25 }) => {
  const { spots, loading, error, hasLocation } = useSafeMeetupSpots(radiusKm);

  if (!hasLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safe MeetUp Spots
          </CardTitle>
          <CardDescription>
            Enable location access to find safe, monitored meeting locations near you
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safe MeetUp Spots
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Safe MeetUp Spots
          </CardTitle>
          <CardDescription>
            Error loading safe meeting locations: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safe MeetUp Spots
        </h3>
        <span className="text-sm text-muted-foreground">
          {spots.length} location{spots.length !== 1 ? 's' : ''} within {radiusKm}km
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Meet safely at these verified locations with security cameras and monitoring.
        Perfect for buying/selling items from our marketplace.
      </p>

      {spots.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No safe meetup spots found within {radiusKm}km of your location.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SafeMeetupSpots;