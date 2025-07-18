import { useState } from 'react';
import { Star, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafetyReviewForm } from './SafetyReviewForm';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';

interface QuickReviewButtonProps {
  adId: string;
  adTitle: string;
  sellerId: string;
  sellerName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const QuickReviewButton = ({ 
  adId, 
  adTitle, 
  sellerId, 
  sellerName,
  variant = 'default',
  size = 'default',
  className = '' 
}: QuickReviewButtonProps) => {
  const { user } = useAuth();
  const { getUserReputation } = useReviews();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState<number>(0);

  // Don't show if user is not logged in or is the seller
  if (!user || user.id === sellerId) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => setShowReviewForm(true)}
      >
        <MessageSquareText className="h-4 w-4" />
        Write Review
        {rating > 0 && (
          <Badge variant="secondary" className="ml-1">
            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </Badge>
        )}
      </Button>

      <SafetyReviewForm
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        userId={sellerId}
        adId={adId}
        adTitle={adTitle}
        onSubmit={() => {
          setShowReviewForm(false);
          // Optionally refresh data
        }}
      />
    </>
  );
};