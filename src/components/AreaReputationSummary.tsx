import { useEffect, useState } from 'react';
import { MapPin, Star, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocalReputation } from '@/hooks/useLocalReputation';

interface AreaReputationSummaryProps {
  radiusKm?: number;
}

export const AreaReputationSummary = ({ radiusKm = 25 }: AreaReputationSummaryProps) => {
  const { getAreaSummary, userLocation, loading } = useLocalReputation();
  const [areaSummary, setAreaSummary] = useState<{
    total_reviews: number;
    average_rating: number;
    area_name: string;
    radius_km: number;
  } | null>(null);

  useEffect(() => {
    const loadAreaSummary = async () => {
      if (userLocation?.coords?.latitude && userLocation?.coords?.longitude) {
        const summary = await getAreaSummary(radiusKm);
        setAreaSummary(summary);
      }
    };

    loadAreaSummary();
  }, [radiusKm, userLocation, getAreaSummary]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAreaQualityBadge = (rating: number, reviewCount: number) => {
    if (reviewCount < 5) return { label: 'Limited Data', color: 'bg-gray-100 text-gray-600' };
    if (rating >= 4.5) return { label: 'Excellent Area', color: 'bg-green-100 text-green-700' };
    if (rating >= 4.0) return { label: 'Good Area', color: 'bg-blue-100 text-blue-700' };
    if (rating >= 3.5) return { label: 'Fair Area', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Caution Advised', color: 'bg-red-100 text-red-700' };
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userLocation?.coords?.latitude || !userLocation?.coords?.longitude) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enable location to see area reputation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!areaSummary || areaSummary.total_reviews === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No marketplace activity in your area yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const qualityBadge = getAreaQualityBadge(areaSummary.average_rating, areaSummary.total_reviews);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span>Area Marketplace Reputation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{areaSummary.area_name}</p>
            <p className="text-xs text-muted-foreground">{radiusKm}km radius</p>
          </div>
          <Badge className={`${qualityBadge.color} border-0`}>
            {qualityBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {renderStars(areaSummary.average_rating)}
              <span className="font-semibold">{areaSummary.average_rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="font-semibold">{areaSummary.total_reviews}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {areaSummary.total_reviews >= 20 
            ? "Your area has strong marketplace activity with reliable reputation data." 
            : areaSummary.total_reviews >= 5 
            ? "Your area has moderate marketplace activity. More reviews will improve accuracy."
            : "Your area has limited marketplace activity. Be extra cautious when trading."
          }
        </div>
      </CardContent>
    </Card>
  );
};