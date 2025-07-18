import { Star, Shield, MessageCircle, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SafetyRatingDisplayProps {
  safetyRating?: number;
  communicationRating?: number;
  reliabilityRating?: number;
  paymentSafetyRating?: number;
  overallSafetyScore?: number;
  compact?: boolean;
  showTitle?: boolean;
}

export const SafetyRatingDisplay = ({
  safetyRating,
  communicationRating,
  reliabilityRating,
  paymentSafetyRating,
  overallSafetyScore,
  compact = false,
  showTitle = true
}: SafetyRatingDisplayProps) => {
  const hasAnyRating = safetyRating || communicationRating || reliabilityRating || paymentSafetyRating;

  if (!hasAnyRating && !overallSafetyScore) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const getSafetyLevel = (score: number) => {
    if (score >= 4.5) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 4.0) return { label: 'Very Good', color: 'bg-green-400', textColor: 'text-green-600' };
    if (score >= 3.5) return { label: 'Good', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    if (score >= 3.0) return { label: 'Fair', color: 'bg-orange-400', textColor: 'text-orange-700' };
    if (score >= 2.0) return { label: 'Poor', color: 'bg-red-400', textColor: 'text-red-700' };
    return { label: 'Very Poor', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {overallSafetyScore && overallSafetyScore > 0 && (
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{overallSafetyScore.toFixed(1)}</span>
            <Badge variant="secondary" className={getSafetyLevel(overallSafetyScore).textColor}>
              {getSafetyLevel(overallSafetyScore).label}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            <span>Safety & Trust Ratings</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Overall Safety Score */}
        {overallSafetyScore && overallSafetyScore > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Safety Score</span>
              <Badge className={getSafetyLevel(overallSafetyScore).textColor}>
                {getSafetyLevel(overallSafetyScore).label}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Progress 
                value={(overallSafetyScore / 5) * 100} 
                className="flex-1"
              />
              <span className="text-sm font-semibold">
                {overallSafetyScore.toFixed(1)}/5.0
              </span>
            </div>
          </div>
        )}

        {/* Individual Safety Ratings */}
        <div className="grid grid-cols-1 gap-3">
          {safetyRating && safetyRating > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">Transaction Safety</span>
              </div>
              {renderStars(safetyRating)}
            </div>
          )}

          {communicationRating && communicationRating > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Communication</span>
              </div>
              {renderStars(communicationRating)}
            </div>
          )}

          {reliabilityRating && reliabilityRating > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Reliability</span>
              </div>
              {renderStars(reliabilityRating)}
            </div>
          )}

          {paymentSafetyRating && paymentSafetyRating > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Payment Safety</span>
              </div>
              {renderStars(paymentSafetyRating)}
            </div>
          )}
        </div>

        {!hasAnyRating && overallSafetyScore && (
          <p className="text-xs text-muted-foreground text-center">
            Based on historical safety ratings
          </p>
        )}
      </CardContent>
    </Card>
  );
};