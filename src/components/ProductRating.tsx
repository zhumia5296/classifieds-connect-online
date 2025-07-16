import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';

interface ProductRatingProps {
  userId: string;
  showReviewCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProductRating = ({ 
  userId, 
  showReviewCount = true, 
  size = 'md',
  className = '' 
}: ProductRatingProps) => {
  const { getUserReputation } = useReviews();
  const [rating, setRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRating();
  }, [userId]);

  const loadRating = async () => {
    setLoading(true);
    try {
      const reputation = await getUserReputation(userId);
      if (reputation) {
        setRating(reputation.average_rating || 0);
        setReviewCount(reputation.total_reviews || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStarSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className={`${getStarSize()} bg-muted rounded animate-pulse`} />
          ))}
        </div>
        {showReviewCount && (
          <div className={`${getTextSize()} bg-muted rounded h-4 w-12 animate-pulse`} />
        )}
      </div>
    );
  }

  if (reviewCount === 0) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`${getStarSize()} text-muted`} />
          ))}
        </div>
        {showReviewCount && (
          <span className={getTextSize()}>No reviews</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${getStarSize()} ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted'
            }`}
          />
        ))}
      </div>
      <span className={`${getTextSize()} font-medium`}>
        {rating.toFixed(1)}
      </span>
      {showReviewCount && (
        <span className={`${getTextSize()} text-muted-foreground`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
};