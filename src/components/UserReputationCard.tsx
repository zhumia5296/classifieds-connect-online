import { Star, Award, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReviews, UserReputation } from '@/hooks/useReviews';
import { SafetyRatingDisplay } from './SafetyRatingDisplay';

interface UserReputationCardProps {
  reputation: UserReputation | null;
  compact?: boolean;
}

export const UserReputationCard = ({ reputation, compact = false }: UserReputationCardProps) => {
  const { getReputationLevel } = useReviews();

  if (!reputation || reputation.total_reviews === 0) {
    return (
      <Card className={compact ? "w-full" : "w-full"}>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="text-center text-muted-foreground">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No reviews yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reputationLevel = getReputationLevel(reputation.reputation_score);
  const averageRating = Number(reputation.average_rating);

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

  const getRatingDistribution = () => {
    const total = reputation.total_reviews;
    return [
      { stars: 5, count: reputation.five_star_count, percentage: (reputation.five_star_count / total) * 100 },
      { stars: 4, count: reputation.four_star_count, percentage: (reputation.four_star_count / total) * 100 },
      { stars: 3, count: reputation.three_star_count, percentage: (reputation.three_star_count / total) * 100 },
      { stars: 2, count: reputation.two_star_count, percentage: (reputation.two_star_count / total) * 100 },
      { stars: 1, count: reputation.one_star_count, percentage: (reputation.one_star_count / total) * 100 },
    ];
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {renderStars(averageRating)}
                  <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ({reputation.total_reviews} reviews)
                </div>
              </div>
              <Badge className={`${reputationLevel.bgColor} ${reputationLevel.color} border-0`}>
                {reputationLevel.level}
              </Badge>
            </div>
            
            {/* Safety Rating Compact Display */}
            <SafetyRatingDisplay
              overallSafetyScore={reputation.overall_safety_score}
              compact={true}
              showTitle={false}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5" />
          <span>User Reputation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {renderStars(averageRating)}
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {reputation.total_reviews} reviews
          </p>
          <Badge className={`${reputationLevel.bgColor} ${reputationLevel.color} border-0 mt-2`}>
            {reputationLevel.level} • {reputation.reputation_score} points
          </Badge>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Rating Breakdown</h4>
          {getRatingDistribution().map((rating) => (
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

        {/* Transaction Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-lg">{reputation.total_sales}</span>
            </div>
            <p className="text-xs text-muted-foreground">Items Sold</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-lg">{reputation.total_purchases}</span>
            </div>
            <p className="text-xs text-muted-foreground">Items Bought</p>
          </div>
        </div>

        {/* Safety Ratings */}
        <SafetyRatingDisplay
          safetyRating={reputation.average_safety_rating}
          communicationRating={reputation.average_communication_rating}
          reliabilityRating={reputation.average_reliability_rating}
          paymentSafetyRating={reputation.average_payment_safety_rating}
          overallSafetyScore={reputation.overall_safety_score}
          compact={false}
          showTitle={true}
        />

        {/* Reputation Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reputation Progress</span>
            <span className="text-xs text-muted-foreground">
              {reputation.reputation_score} / 2000
            </span>
          </div>
          <Progress 
            value={(reputation.reputation_score / 2000) * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {2000 - reputation.reputation_score > 0 
              ? `${2000 - reputation.reputation_score} points to Elite status`
              : 'Elite status achieved!'
            }
          </p>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {new Date(reputation.last_updated).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};