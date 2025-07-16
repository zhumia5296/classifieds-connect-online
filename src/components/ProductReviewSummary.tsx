import { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReviews } from '@/hooks/useReviews';

interface ProductReviewSummaryProps {
  userId: string;
  className?: string;
}

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export const ProductReviewSummary = ({ userId, className = '' }: ProductReviewSummaryProps) => {
  const { getUserReviews, getUserReputation, getReputationLevel } = useReviews();
  const [reviews, setReviews] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any>(null);
  const [distribution, setDistribution] = useState<RatingDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reviewsData, reputationData] = await Promise.all([
        getUserReviews(userId),
        getUserReputation(userId)
      ]);

      setReviews(reviewsData);
      setReputation(reputationData);

      // Calculate distribution
      if (reviewsData.length > 0) {
        const dist = [5, 4, 3, 2, 1].map(rating => {
          const count = reviewsData.filter(review => review.rating === rating).length;
          return {
            rating,
            count,
            percentage: (count / reviewsData.length) * 100
          };
        });
        setDistribution(dist);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-2 bg-muted rounded w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reputation || reviews.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 text-muted" />
            <p>No reviews yet</p>
            <p className="text-sm">Be the first to leave a review!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reputationLevel = getReputationLevel(reputation.reputation_score || 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Customer Reviews
          <Badge variant="secondary" className={`${reputationLevel.bgColor} ${reputationLevel.color}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {reputationLevel.level} Seller
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">
              {reputation.average_rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(reputation.average_rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {reputation.total_reviews} review{reputation.total_reviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {distribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 min-w-[60px]">
                  <span className="text-sm">{item.rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={item.percentage} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground min-w-[30px]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reputation.total_sales || 0}
            </div>
            <p className="text-xs text-muted-foreground">Items Sold</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {reputation.reputation_score || 0}
            </div>
            <p className="text-xs text-muted-foreground">Reputation Score</p>
          </div>
        </div>

        {/* Recent Reviews Preview */}
        {reviews.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Recent Reviews</h4>
            <div className="space-y-3">
              {reviews.slice(0, 2).map((review) => (
                <div key={review.id} className="border-l-2 border-primary/20 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.title}</span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};