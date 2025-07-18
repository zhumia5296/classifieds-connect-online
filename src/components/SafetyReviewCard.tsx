import { Star, ThumbsUp, ThumbsDown, Shield, MessageCircle, Clock, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Review } from '@/hooks/useReviews';
import { SafetyRatingDisplay } from './SafetyRatingDisplay';

interface SafetyReviewCardProps {
  review: Review;
  onVote?: (reviewId: string, isHelpful: boolean) => void;
  userVote?: boolean | null;
  showSafetyRatings?: boolean;
}

export const SafetyReviewCard = ({ 
  review, 
  onVote, 
  userVote,
  showSafetyRatings = true 
}: SafetyReviewCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const hasAnyRating = review.safety_rating || review.communication_rating || 
                      review.reliability_rating || review.payment_safety_rating;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewer?.avatar_url} />
              <AvatarFallback>
                {review.reviewer?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold">
                  {review.reviewer?.display_name || 'Anonymous User'}
                </p>
                {review.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          {review.transaction_type && (
            <Badge variant="outline" className="text-xs">
              {review.transaction_type === 'buying' ? 'Buyer' : 'Seller'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Review Title and Content */}
        <div>
          <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
          {review.comment && (
            <p className="text-muted-foreground">{review.comment}</p>
          )}
        </div>

        {/* Safety Ratings */}
        {showSafetyRatings && hasAnyRating && (
          <div className="border-t pt-4">
            <SafetyRatingDisplay
              safetyRating={review.safety_rating}
              communicationRating={review.communication_rating}
              reliabilityRating={review.reliability_rating}
              paymentSafetyRating={review.payment_safety_rating}
              compact={false}
              showTitle={true}
            />
          </div>
        )}

        {/* Ad Reference */}
        {review.ad && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Regarding: <span className="font-medium">{review.ad.title}</span>
            </p>
          </div>
        )}

        {/* Helpfulness Voting */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Was this helpful?</span>
            {onVote && (
              <div className="flex items-center space-x-1">
                <Button
                  variant={userVote === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => onVote(review.id, true)}
                  className="h-8"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant={userVote === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => onVote(review.id, false)}
                  className="h-8"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {review.helpful_count > 0 && (
            <p className="text-sm text-muted-foreground">
              {review.helpful_count} people found this helpful
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};