import { useEffect, useState } from 'react';
import { Star, MapPin, TrendingUp, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalReputation, LocalReputation } from '@/hooks/useLocalReputation';
import { UserReputation } from '@/hooks/useReviews';
import { SafetyRatingDisplay } from './SafetyRatingDisplay';

interface LocalReputationCardProps {
  userId: string;
  globalReputation?: UserReputation | null;
  radiusKm?: number;
  compact?: boolean;
}

export const LocalReputationCard = ({ 
  userId, 
  globalReputation, 
  radiusKm = 25,
  compact = false 
}: LocalReputationCardProps) => {
  const { getLocalReputation, userLocation, loading } = useLocalReputation();
  const [localReputation, setLocalReputation] = useState<LocalReputation | null>(null);

  useEffect(() => {
    const loadLocalReputation = async () => {
      if (userLocation?.coords?.latitude && userLocation?.coords?.longitude) {
        const localData = await getLocalReputation(userId, radiusKm);
        setLocalReputation(localData);
      }
    };

    loadLocalReputation();
  }, [userId, radiusKm, userLocation, getLocalReputation]);

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

  const getLocalRatingDistribution = () => {
    if (!localReputation || localReputation.local_reviews_count === 0) return [];
    
    const total = localReputation.local_reviews_count;
    return [
      { stars: 5, count: localReputation.local_five_star_count, percentage: (localReputation.local_five_star_count / total) * 100 },
      { stars: 4, count: localReputation.local_four_star_count, percentage: (localReputation.local_four_star_count / total) * 100 },
      { stars: 3, count: localReputation.local_three_star_count, percentage: (localReputation.local_three_star_count / total) * 100 },
      { stars: 2, count: localReputation.local_two_star_count, percentage: (localReputation.local_two_star_count / total) * 100 },
      { stars: 1, count: localReputation.local_one_star_count, percentage: (localReputation.local_one_star_count / total) * 100 },
    ];
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userLocation?.coords?.latitude || !userLocation?.coords?.longitude) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enable location to see local reputation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Local Reputation</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {radiusKm}km radius
              </Badge>
            </div>
            
            {localReputation && localReputation.local_reviews_count > 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {renderStars(localReputation.local_average_rating)}
                    <span className="font-semibold">{localReputation.local_average_rating.toFixed(1)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({localReputation.local_reviews_count} local reviews)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No local reviews yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span>Local vs Global Reputation</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="local-details">Local Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local Reputation */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">Local ({radiusKm}km)</h4>
                </div>
                
                {localReputation && localReputation.local_reviews_count > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        {renderStars(localReputation.local_average_rating)}
                        <span className="text-xl font-bold">{localReputation.local_average_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {localReputation.local_reviews_count} local reviews
                      </p>
                    </div>
                    
                    {/* Local Safety Score */}
                    {localReputation.local_average_safety && (
                      <SafetyRatingDisplay
                        safetyRating={localReputation.local_average_safety}
                        communicationRating={localReputation.local_average_communication}
                        reliabilityRating={localReputation.local_average_reliability}
                        paymentSafetyRating={localReputation.local_average_payment_safety}
                        compact={true}
                        showTitle={false}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No local reviews yet</p>
                  </div>
                )}
              </div>

              {/* Global Reputation */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold">Global</h4>
                </div>
                
                {globalReputation && globalReputation.total_reviews > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        {renderStars(globalReputation.average_rating)}
                        <span className="text-xl font-bold">{globalReputation.average_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {globalReputation.total_reviews} total reviews
                      </p>
                    </div>
                    
                    {/* Global Safety Score */}
                    <SafetyRatingDisplay
                      overallSafetyScore={globalReputation.overall_safety_score}
                      compact={true}
                      showTitle={false}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No global reviews yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison Insights */}
            {localReputation && globalReputation && localReputation.local_reviews_count > 0 && globalReputation.total_reviews > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h5 className="font-medium text-sm">Local vs Global Insights</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${
                      localReputation.local_average_rating > globalReputation.average_rating 
                        ? 'text-green-600' 
                        : localReputation.local_average_rating < globalReputation.average_rating 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                    }`}>
                      {localReputation.local_average_rating > globalReputation.average_rating ? '+' : ''}
                      {(localReputation.local_average_rating - globalReputation.average_rating).toFixed(1)}
                    </div>
                    <p className="text-muted-foreground">Rating Difference</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {((localReputation.local_reviews_count / globalReputation.total_reviews) * 100).toFixed(0)}%
                    </div>
                    <p className="text-muted-foreground">Reviews from Area</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {localReputation.local_reviews_count >= 5 ? 'High' : localReputation.local_reviews_count >= 2 ? 'Medium' : 'Low'}
                    </div>
                    <p className="text-muted-foreground">Local Activity</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="local-details" className="space-y-6">
            {localReputation && localReputation.local_reviews_count > 0 ? (
              <>
                {/* Rating Distribution */}
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Local Rating Breakdown</h5>
                  {getLocalRatingDistribution().map((rating) => (
                    <div key={rating.stars} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-xs">{rating.stars}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <Progress value={rating.percentage} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-8">
                        {rating.count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Local Safety Metrics */}
                {localReputation.local_average_safety && (
                  <SafetyRatingDisplay
                    safetyRating={localReputation.local_average_safety}
                    communicationRating={localReputation.local_average_communication}
                    reliabilityRating={localReputation.local_average_reliability}
                    paymentSafetyRating={localReputation.local_average_payment_safety}
                    compact={false}
                    showTitle={true}
                  />
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h5 className="font-medium mb-2">No Local Reviews</h5>
                <p className="text-sm">
                  This seller doesn't have any reviews from transactions in your {radiusKm}km area yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};